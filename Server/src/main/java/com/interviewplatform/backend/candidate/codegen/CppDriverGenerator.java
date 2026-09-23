package com.interviewplatform.backend.candidate.codegen;

import com.interviewplatform.backend.model.ExecutionMetadata;
import com.interviewplatform.backend.model.TestCase;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CppDriverGenerator {

    private static final Pattern PUBLIC_METHOD_PATTERN = Pattern.compile(
            "public\\s*:\\s*(?:[^;{}]*?\\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\([^)]*\\)\\s*(?:const\\s*)?\\{",
            Pattern.DOTALL
    );

    private static final Pattern FALLBACK_METHOD_PATTERN = Pattern.compile(
            "class\\s+Solution\\s*\\{.*?([a-zA-Z0-9_<>,:*&\\s\\[\\]]+?)\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\([^)]*\\)\\s*(?:const\\s*)?\\{",
            Pattern.DOTALL
    );

    private static final Pattern RETURN_TYPE_PATTERN = Pattern.compile(
            "public\\s*:\\s*([a-zA-Z0-9_<>,:*&\\s\\[\\]]+?)\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s*\\([^)]*\\)\\s*(?:const\\s*)?\\{",
            Pattern.DOTALL
    );

    private static final Pattern METHOD_PARAMS_PATTERN = Pattern.compile(
            "class\\s+Solution\\s*\\{.*?[a-zA-Z0-9_<>,:*&\\s\\[\\]]+?\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s*\\(([^)]*)\\)\\s*(?:const\\s*)?\\{",
            Pattern.DOTALL
    );

    public String generate(
            String userCode,
            ExecutionMetadata metadata,
            List<TestCase> testCases
    ) {
        StringBuilder source = new StringBuilder();

        // Standard headers and namespace
        source.append("#include <bits/stdc++.h>\n");
        source.append("#include <iostream>\n");
        source.append("#include <vector>\n");
        source.append("#include <string>\n");
        source.append("#include <unordered_set>\n");
        source.append("using namespace std;\n\n");
        source.append("#pragma GCC diagnostic ignored \"-Wsign-compare\"\n\n");

        // Data structure definitions (injected if not explicitly defined by user)
        source.append(generateDataStructureDeclarations(userCode));

        // User Solution class
        source.append(userCode);
        source.append("\n\n");

        // Helper printing utilities supporting primitives, strings, nested vectors, and linked lists
        source.append("// Forward declarations for result printing\n");
        source.append("template<typename T> void printResult(const T& val);\n");
        source.append("inline void printResult(const string& val);\n");
        source.append("inline void printResult(const char& val);\n");
        source.append("template<typename T> void printResult(const vector<T>& vec);\n");
        source.append("inline void printResult(ListNode* head);\n\n");

        source.append("template<typename T>\n");
        source.append("void printResult(const T& val) {\n");
        source.append("    cout << boolalpha << val;\n");
        source.append("}\n\n");

        source.append("inline void printResult(const string& val) {\n");
        source.append("    cout << \"\\\"\" << val << \"\\\"\";\n");
        source.append("}\n\n");

        source.append("inline void printResult(const char& val) {\n");
        source.append("    cout << \"'\" << val << \"'\";\n");
        source.append("}\n\n");

        source.append("template<typename T>\n");
        source.append("void printResult(const vector<T>& vec) {\n");
        source.append("    cout << \"[\";\n");
        source.append("    for (size_t i = 0; i < vec.size(); ++i) {\n");
        source.append("        if (i > 0) cout << \",\";\n");
        source.append("        printResult(vec[i]);\n");
        source.append("    }\n");
        source.append("    cout << \"]\";\n");
        source.append("}\n\n");

        source.append("inline void printResult(ListNode* head) {\n");
        source.append("    cout << \"[\";\n");
        source.append("    unordered_set<ListNode*> visited;\n");
        source.append("    ListNode* curr = head;\n");
        source.append("    bool first = true;\n");
        source.append("    int count = 0;\n");
        source.append("    while (curr != nullptr && count < 10000) {\n");
        source.append("        if (visited.count(curr)) {\n");
        source.append("            break;\n");
        source.append("        }\n");
        source.append("        visited.insert(curr);\n");
        source.append("        if (!first) cout << \",\";\n");
        source.append("        cout << curr->val;\n");
        source.append("        first = false;\n");
        source.append("        curr = curr->next;\n");
        source.append("        count++;\n");
        source.append("    }\n");
        source.append("    cout << \"]\";\n");
        source.append("}\n\n");

        // Helper functions for building linked lists
        source.append("// Helper functions for building linked lists\n");
        source.append("inline ListNode* buildListNode(const vector<int>& vals) {\n");
        source.append("    if (vals.empty()) return nullptr;\n");
        source.append("    ListNode* head = new ListNode(vals[0]);\n");
        source.append("    ListNode* curr = head;\n");
        source.append("    for (size_t i = 1; i < vals.size(); ++i) {\n");
        source.append("        curr->next = new ListNode(vals[i]);\n");
        source.append("        curr = curr->next;\n");
        source.append("    }\n");
        source.append("    return head;\n");
        source.append("}\n\n");

        source.append("inline vector<ListNode*> buildListNodeVector(const vector<vector<int>>& arrs) {\n");
        source.append("    vector<ListNode*> res;\n");
        source.append("    res.reserve(arrs.size());\n");
        source.append("    for (const auto& arr : arrs) {\n");
        source.append("        res.push_back(buildListNode(arr));\n");
        source.append("    }\n");
        source.append("    return res;\n");
        source.append("}\n\n");

        // Determine method name and return type
        String methodName = (metadata != null && metadata.getMethodName() != null && !metadata.getMethodName().isBlank())
                ? metadata.getMethodName()
                : extractMethodName(userCode);

        String returnType = (metadata != null && metadata.getReturnType() != null && !metadata.getReturnType().isBlank())
                ? metadata.getReturnType()
                : extractReturnType(userCode);

        boolean isVoid = "void".equalsIgnoreCase(returnType);

        List<String> paramTypes = (metadata != null && metadata.getParameterTypes() != null && !metadata.getParameterTypes().isEmpty())
                ? metadata.getParameterTypes()
                : extractParameterTypes(userCode);

        // Generate main()
        source.append("int main() {\n");
        source.append("    Solution solution;\n");

        if (testCases != null && !testCases.isEmpty() && methodName != null && !methodName.isBlank()) {
            for (TestCase testCase : testCases) {
                source.append("    {\n");

                List<String> arguments = testCase.getArguments();

                if (arguments != null && !arguments.isEmpty()) {
                    StringBuilder callArgs = new StringBuilder();

                    for (int i = 0; i < arguments.size(); i++) {
                        String paramType = (paramTypes != null && i < paramTypes.size()) ? paramTypes.get(i) : null;
                        String converted = convertArgument(arguments.get(i), paramType);
                        String varName = "arg" + i;

                        source.append("        auto ").append(varName).append(" = ").append(converted).append(";\n");

                        if (i > 0) {
                            callArgs.append(", ");
                        }
                        callArgs.append(varName);
                    }

                    if (isVoid) {
                        source.append("        solution.").append(methodName).append("(").append(callArgs).append(");\n");
                        source.append("        printResult(arg0);\n");
                    } else {
                        source.append("        auto result = solution.").append(methodName).append("(").append(callArgs).append(");\n");
                        source.append("        printResult(result);\n");
                    }
                } else {
                    if (isVoid) {
                        source.append("        solution.").append(methodName).append("();\n");
                    } else {
                        source.append("        auto result = solution.").append(methodName).append("();\n");
                        source.append("        printResult(result);\n");
                    }
                }

                source.append("        cout << \"\\n\";\n");
                source.append("    }\n");
            }
        }

        source.append("    return 0;\n");
        source.append("}\n");

        return source.toString();
    }

    private String generateDataStructureDeclarations(String userCode) {
        StringBuilder sb = new StringBuilder();
        if (!definesStructOrClass(userCode, "ListNode")) {
            sb.append("// Definition for singly-linked list (injected)\n");
            sb.append("struct ListNode {\n");
            sb.append("    int val;\n");
            sb.append("    ListNode *next;\n");
            sb.append("    ListNode() : val(0), next(nullptr) {}\n");
            sb.append("    ListNode(int x) : val(x), next(nullptr) {}\n");
            sb.append("    ListNode(int x, ListNode *next) : val(x), next(next) {}\n");
            sb.append("};\n\n");
        }
        return sb.toString();
    }

    private boolean definesStructOrClass(String userCode, String name) {
        if (userCode == null) return false;
        String clean = stripComments(userCode);
        Pattern p = Pattern.compile("\\b(?:struct|class)\\s+" + Pattern.quote(name) + "\\b");
        return p.matcher(clean).find();
    }

    private String stripComments(String code) {
        if (code == null) return "";
        String noBlock = Pattern.compile("/\\*.*?\\*/", Pattern.DOTALL).matcher(code).replaceAll(" ");
        return Pattern.compile("//.*").matcher(noBlock).replaceAll(" ");
    }

    public String convertArgument(String rawArg, String paramType) {
        if (rawArg == null || rawArg.trim().isEmpty()) {
            return "{}";
        }
        rawArg = rawArg.trim();

        String cppType = mapParamTypeToCpp(paramType);
        if (cppType == null && paramType != null) {
            cppType = paramType.trim();
        }

        if ("ListNode*".equals(cppType)) {
            if (rawArg.equals("[]") || rawArg.equalsIgnoreCase("null") || rawArg.equalsIgnoreCase("nullptr")) {
                return "nullptr";
            }
            if (rawArg.startsWith("[")) {
                return "buildListNode(vector<int>" + toBraces(rawArg) + ")";
            }
            return "buildListNode(" + rawArg + ")";
        }

        if ("vector<ListNode*>".equals(cppType)) {
            if (rawArg.equals("[]") || rawArg.equalsIgnoreCase("null")) {
                return "vector<ListNode*>{}";
            }
            if (rawArg.startsWith("[[")) {
                return "buildListNodeVector(vector<vector<int>>" + toBraces(rawArg) + ")";
            }
            if (rawArg.startsWith("[")) {
                return "buildListNodeVector(" + rawArg + ")";
            }
        }

        if ("bool".equals(cppType) || rawArg.equalsIgnoreCase("true") || rawArg.equalsIgnoreCase("false")) {
            return rawArg.toLowerCase();
        }

        if ("char".equals(cppType) || (rawArg.startsWith("'") && rawArg.endsWith("'"))) {
            if (rawArg.startsWith("'") && rawArg.endsWith("'")) {
                return rawArg;
            }
            return "'" + rawArg.replace("'", "") + "'";
        }

        if ("string".equals(cppType) || (rawArg.startsWith("\"") && rawArg.endsWith("\"") && !rawArg.startsWith("["))) {
            if (rawArg.startsWith("\"") && rawArg.endsWith("\"")) {
                return "string(" + rawArg + ")";
            }
            return "string(\"" + rawArg.replace("\"", "") + "\")";
        }

        // 2D vector
        if (rawArg.startsWith("[[")) {
            String braces = toBraces(rawArg);
            if (cppType != null && cppType.startsWith("vector<vector<")) {
                return cppType + braces;
            }
            if (rawArg.contains("\"")) {
                return "vector<vector<string>>" + braces;
            }
            if (rawArg.contains("'")) {
                return "vector<vector<char>>" + braces;
            }
            return "vector<vector<int>>" + braces;
        }

        // 1D vector
        if (rawArg.startsWith("[")) {
            String braces = toBraces(rawArg);
            if (cppType != null && cppType.startsWith("vector<")) {
                return cppType + braces;
            }
            if (rawArg.contains("\"")) {
                return "vector<string>" + braces;
            }
            if (rawArg.contains("'")) {
                return "vector<char>" + braces;
            }
            return "vector<int>" + braces;
        }

        // Primitive number or existing expression
        return rawArg;
    }

    private String toBraces(String s) {
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        boolean inSingleQuotes = false;
        boolean escape = false;

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (escape) {
                sb.append(c);
                escape = false;
                continue;
            }
            if (c == '\\') {
                sb.append(c);
                escape = true;
                continue;
            }
            if (c == '"' && !inSingleQuotes) {
                inQuotes = !inQuotes;
                sb.append(c);
            } else if (c == '\'' && !inQuotes) {
                inSingleQuotes = !inSingleQuotes;
                sb.append(c);
            } else if (!inQuotes && !inSingleQuotes) {
                if (c == '[') {
                    sb.append('{');
                } else if (c == ']') {
                    sb.append('}');
                } else {
                    sb.append(c);
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private String mapParamTypeToCpp(String type) {
        if (type == null) return null;
        type = type.trim();

        if (type.equals("ListNode") || type.equals("ListNode*") || type.equals("*ListNode")) {
            return "ListNode*";
        }
        if (type.equals("ListNode[]") || type.equals("vector<ListNode*>") || type.equals("List<ListNode>") || type.equals("List<ListNode*>")) {
            return "vector<ListNode*>";
        }

        switch (type) {
            case "int": return "int";
            case "long": return "long long";
            case "double": return "double";
            case "float": return "float";
            case "boolean":
            case "bool": return "bool";
            case "char": return "char";
            case "String":
            case "string": return "string";
            case "int[]": return "vector<int>";
            case "String[]": return "vector<string>";
            case "char[]": return "vector<char>";
            case "int[][]": return "vector<vector<int>>";
            case "char[][]": return "vector<vector<char>>";
            case "String[][]": return "vector<vector<string>>";
            case "List<Integer>": return "vector<int>";
            case "List<String>": return "vector<string>";
            case "List<List<Integer>>": return "vector<vector<int>>";
            case "List<List<String>>": return "vector<vector<string>>";
            default:
                if (type.contains("List<List<String>>")) return "vector<vector<string>>";
                if (type.contains("List<List<Integer>>")) return "vector<vector<int>>";
                if (type.contains("List<String>")) return "vector<string>";
                if (type.contains("List<Integer>")) return "vector<int>";
                return null;
        }
    }

    private String extractMethodName(String userCode) {
        if (userCode == null) return null;
        String cleanCode = stripComments(userCode);
        Matcher m = PUBLIC_METHOD_PATTERN.matcher(cleanCode);
        if (m.find()) {
            return m.group(1).trim();
        }
        Matcher fallback = FALLBACK_METHOD_PATTERN.matcher(cleanCode);
        if (fallback.find()) {
            return fallback.group(2).trim();
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
        Matcher m = METHOD_PARAMS_PATTERN.matcher(cleanCode);
        if (!m.find()) return null;
        String paramsStr = m.group(1).trim();
        if (paramsStr.isEmpty()) return List.of();

        List<String> result = new ArrayList<>();
        List<String> paramTokens = splitTopLevelCommas(paramsStr);
        for (String param : paramTokens) {
            param = param.trim();
            int eqIdx = param.indexOf('=');
            if (eqIdx != -1) {
                param = param.substring(0, eqIdx).trim();
            }
            int lastSpace = param.lastIndexOf(' ');
            if (lastSpace != -1) {
                String typePart = param.substring(0, lastSpace).trim();
                typePart = typePart.replaceFirst("^const\\s+", "").trim();
                if (typePart.endsWith("&")) {
                    typePart = typePart.substring(0, typePart.length() - 1).trim();
                }
                result.add(typePart);
            } else {
                result.add(param);
            }
        }
        return result;
    }

    private List<String> splitTopLevelCommas(String s) {
        List<String> parts = new ArrayList<>();
        int depth = 0;
        StringBuilder cur = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '<' || c == '(' || c == '[' || c == '{') {
                depth++;
            } else if (c == '>' || c == ')' || c == ']' || c == '}') {
                depth--;
            } else if (c == ',' && depth == 0) {
                parts.add(cur.toString());
                cur = new StringBuilder();
                continue;
            }
            cur.append(c);
        }
        if (cur.length() > 0) {
            parts.add(cur.toString());
        }
        return parts;
    }
}
