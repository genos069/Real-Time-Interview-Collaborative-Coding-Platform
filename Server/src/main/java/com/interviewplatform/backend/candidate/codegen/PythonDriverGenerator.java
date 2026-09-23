package com.interviewplatform.backend.candidate.codegen;

import com.interviewplatform.backend.model.ExecutionMetadata;
import com.interviewplatform.backend.model.TestCase;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PythonDriverGenerator {

    private static final Pattern METHOD_NAME_PATTERN = Pattern.compile(
            "def\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(\\s*self\\b"
    );

    private static final Pattern RETURN_TYPE_PATTERN = Pattern.compile(
            "def\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s*\\([^)]*\\)\\s*->\\s*([a-zA-Z0-9_\\[\\],\\s]+):"
    );

    private static final Pattern PARAMS_PATTERN = Pattern.compile(
            "def\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s*\\(\\s*self\\s*(?:,\\s*([^)]*))?\\)"
    );

    public String generate(
            String userCode,
            ExecutionMetadata metadata,
            List<TestCase> testCases
    ) {
        StringBuilder source = new StringBuilder();

        // Standard typing, utility imports
        source.append("from typing import *\n");
        source.append("import collections\n");
        source.append("import heapq\n");
        source.append("import math\n");
        source.append("import json\n");
        source.append("import base64\n");
        source.append("import sys\n\n");

        // Data structure definitions (injected if not explicitly defined by user)
        source.append(generateDataStructureDeclarations(userCode));

        // Helpers for building linked lists and serializing outputs
        source.append("""
                def _build_list_node(vals):
                    if not vals:
                        return None
                    head = ListNode(vals[0])
                    curr = head
                    for v in vals[1:]:
                        curr.next = ListNode(v)
                        curr = curr.next
                    return head

                def _build_list_node_vector(arrs):
                    if not arrs:
                        return []
                    return [_build_list_node(arr) for arr in arrs]

                def _list_node_to_list(head):
                    res = []
                    visited = set()
                    curr = head
                    count = 0
                    while curr is not None and count < 10000:
                        if id(curr) in visited:
                            break
                        visited.add(id(curr))
                        res.append(curr.val)
                        curr = curr.next
                        count += 1
                    return res

                def _serialize(val, is_list_node=False):
                    if is_list_node and val is None:
                        return "[]"
                    if isinstance(val, ListNode):
                        return json.dumps(_list_node_to_list(val), separators=(',', ':'))
                    if isinstance(val, (list, tuple)):
                        if val and isinstance(val[0], ListNode):
                            return json.dumps([_list_node_to_list(node) for node in val], separators=(',', ':'))
                        return json.dumps(val, separators=(',', ':'))
                    if isinstance(val, bool):
                        return "true" if val else "false"
                    if val is None:
                        return "[]"
                    return json.dumps(val, separators=(',', ':'))

                """);

        // Safely execute user code via base64 compilation to catch SyntaxError
        String safeUserCode = userCode != null ? userCode : "";
        String b64Code = Base64.getEncoder().encodeToString(safeUserCode.getBytes(StandardCharsets.UTF_8));

        source.append("_user_code_b64 = \"").append(b64Code).append("\"\n");
        source.append("_user_code = base64.b64decode(_user_code_b64).decode('utf-8')\n\n");
        source.append("""
                try:
                    _compiled = compile(_user_code, '<string>', 'exec')
                    exec(_compiled, globals())
                except SyntaxError as _e:
                    sys.stdout.write(f"SyntaxError: {_e}\\n")
                    sys.exit(0)
                except Exception as _e:
                    sys.stdout.write(f"CompilationError: {_e}\\n")
                    sys.exit(0)

                """);

        // Determine method name and return type
        String methodName = (metadata != null && metadata.getMethodName() != null && !metadata.getMethodName().isBlank())
                ? metadata.getMethodName()
                : extractMethodName(safeUserCode);

        String returnType = (metadata != null && metadata.getReturnType() != null && !metadata.getReturnType().isBlank())
                ? metadata.getReturnType()
                : extractReturnType(safeUserCode);

        boolean isVoid = "void".equalsIgnoreCase(returnType) || "None".equalsIgnoreCase(returnType);
        boolean isListNodeReturn = isListNodeType(returnType);

        List<String> paramTypes = (metadata != null && metadata.getParameterTypes() != null && !metadata.getParameterTypes().isEmpty())
                ? metadata.getParameterTypes()
                : extractParameterTypes(safeUserCode);

        // Instantiate solution
        source.append("solution = Solution()\n\n");

        if (testCases != null && !testCases.isEmpty() && methodName != null && !methodName.isBlank()) {
            for (TestCase testCase : testCases) {
                List<String> args = testCase.getArguments();
                StringBuilder callArgs = new StringBuilder();

                if (args != null && !args.isEmpty()) {
                    for (int i = 0; i < args.size(); i++) {
                        String paramType = (paramTypes != null && i < paramTypes.size()) ? paramTypes.get(i) : null;
                        String converted = convertArgument(paramType, args.get(i));
                        String varName = "arg" + i;

                        source.append(varName).append(" = ").append(converted).append("\n");

                        if (i > 0) {
                            callArgs.append(", ");
                        }
                        callArgs.append(varName);
                    }

                    if (isVoid) {
                        source.append("solution.").append(methodName).append("(").append(callArgs).append(")\n");
                        source.append("print(_serialize(arg0))\n");
                    } else {
                        source.append("res = solution.").append(methodName).append("(").append(callArgs).append(")\n");
                        source.append("print(_serialize(res, is_list_node=").append(isListNodeReturn ? "True" : "False").append("))\n");
                    }
                } else {
                    if (isVoid) {
                        source.append("solution.").append(methodName).append("()\n");
                        source.append("print(\"[]\")\n");
                    } else {
                        source.append("res = solution.").append(methodName).append("()\n");
                        source.append("print(_serialize(res, is_list_node=").append(isListNodeReturn ? "True" : "False").append("))\n");
                    }
                }
            }
        }

        return source.toString();
    }

    private String generateDataStructureDeclarations(String userCode) {
        StringBuilder sb = new StringBuilder();
        if (!definesClass(userCode, "ListNode")) {
            sb.append("# Definition for singly-linked list (injected)\n");
            sb.append("class ListNode:\n");
            sb.append("    def __init__(self, val=0, next=None):\n");
            sb.append("        self.val = val\n");
            sb.append("        self.next = next\n\n");
        }
        return sb.toString();
    }

    private boolean definesClass(String userCode, String className) {
        if (userCode == null) return false;
        String clean = stripComments(userCode);
        Pattern p = Pattern.compile("\\bclass\\s+" + Pattern.quote(className) + "\\b");
        return p.matcher(clean).find();
    }

    private String stripComments(String code) {
        if (code == null) return "";
        // Strip multi-line comments/docstrings
        String noDoc = Pattern.compile("('''[\\s\\S]*?'''|\"\"\"[\\s\\S]*?\"\"\")").matcher(code).replaceAll(" ");
        // Strip single-line comments
        return Pattern.compile("#.*").matcher(noDoc).replaceAll(" ");
    }

    private boolean isListNodeType(String type) {
        if (type == null) return false;
        String t = type.trim();
        return t.equals("ListNode") || t.equals("ListNode*") || t.equals("Optional[ListNode]");
    }

    public String convertArgument(String type, String value) {
        if (value == null || value.trim().isEmpty()) {
            return "None";
        }
        value = value.trim();

        if (type == null) {
            if ("true".equalsIgnoreCase(value)) return "True";
            if ("false".equalsIgnoreCase(value)) return "False";
            if ("null".equalsIgnoreCase(value)) return "None";
            return value;
        }

        String t = type.trim();

        // Linked list conversion
        if (t.equals("ListNode") || t.equals("ListNode*") || t.equals("*ListNode") || t.equals("Optional[ListNode]")) {
            if (value.equals("[]") || value.equalsIgnoreCase("null") || value.equalsIgnoreCase("None")) {
                return "None";
            }
            if (value.startsWith("[")) {
                return "_build_list_node(" + value + ")";
            }
            return "_build_list_node(" + value + ")";
        }

        if (t.equals("ListNode[]") || t.equals("vector<ListNode*>") || t.equals("List[ListNode]") || t.equals("List[Optional[ListNode]]") || t.equals("List<ListNode>")) {
            if (value.equals("[]") || value.equalsIgnoreCase("null") || value.equalsIgnoreCase("None")) {
                return "[]";
            }
            if (value.startsWith("[[")) {
                return "_build_list_node_vector(" + value + ")";
            }
            if (value.startsWith("[")) {
                return "_build_list_node_vector(" + value + ")";
            }
        }

        // Booleans
        if (t.equalsIgnoreCase("boolean") || t.equalsIgnoreCase("bool")) {
            if (value.equalsIgnoreCase("true")) return "True";
            if (value.equalsIgnoreCase("false")) return "False";
            return "bool(" + value + ")";
        }

        // Strings
        if (t.equalsIgnoreCase("String") || t.equalsIgnoreCase("string") || t.equalsIgnoreCase("str")) {
            if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                return value;
            }
            return "\"" + value.replace("\"", "\\\"") + "\"";
        }

        // Characters
        if (t.equalsIgnoreCase("char")) {
            if (value.startsWith("'") && value.endsWith("'")) return value;
            return "'" + value.replace("'", "\\'") + "'";
        }

        // Numbers and lists
        if (value.equalsIgnoreCase("true")) return "True";
        if (value.equalsIgnoreCase("false")) return "False";
        if (value.equalsIgnoreCase("null")) return "None";

        return value;
    }

    private String extractMethodName(String userCode) {
        if (userCode == null) return null;
        String cleanCode = stripComments(userCode);
        Matcher m = METHOD_NAME_PATTERN.matcher(cleanCode);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private String extractReturnType(String userCode) {
        if (userCode == null) return null;
        String cleanCode = stripComments(userCode);
        Matcher m = RETURN_TYPE_PATTERN.matcher(cleanCode);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private List<String> extractParameterTypes(String userCode) {
        if (userCode == null) return null;
        String cleanCode = stripComments(userCode);
        Matcher m = PARAMS_PATTERN.matcher(cleanCode);
        if (!m.find()) return null;
        String paramsStr = m.group(1);
        if (paramsStr == null || paramsStr.trim().isEmpty()) return List.of();

        List<String> result = new ArrayList<>();
        String[] parts = paramsStr.split(",");
        for (String part : parts) {
            part = part.trim();
            if (part.contains(":")) {
                String typePart = part.substring(part.indexOf(':') + 1).trim();
                // strip default values e.g. = None
                if (typePart.contains("=")) {
                    typePart = typePart.substring(0, typePart.indexOf('=')).trim();
                }
                result.add(typePart);
            } else {
                result.add(part);
            }
        }
        return result;
    }
}