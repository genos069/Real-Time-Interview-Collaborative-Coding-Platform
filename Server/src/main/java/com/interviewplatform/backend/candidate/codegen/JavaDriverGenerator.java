package com.interviewplatform.backend.candidate.codegen;

import com.interviewplatform.backend.importer.parser.JavaSignatureParser;
import com.interviewplatform.backend.model.ExecutionMetadata;
import com.interviewplatform.backend.model.TestCase;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class JavaDriverGenerator {

    private final JavaSignatureParser signatureParser;

    public JavaDriverGenerator() {
        this.signatureParser = new JavaSignatureParser();
    }

    public JavaDriverGenerator(JavaSignatureParser signatureParser) {
        this.signatureParser = signatureParser;
    }

    public String generate(
            String userCode,
            ExecutionMetadata metadata,
            List<TestCase> testCases
    ) {
        if (metadata == null || metadata.getMethodName() == null || metadata.getMethodName().isBlank()) {
            metadata = signatureParser.parse(userCode);
        }

        // Convert Solution -> Main
        String transformedCode = transformUserCode(userCode);

        // Remove last closing brace
        transformedCode = removeLastBrace(transformedCode);

        StringBuilder source = new StringBuilder();

        // Common Java imports
        source.append("import java.util.*;\n");
        source.append("import java.util.Arrays;\n\n");

        source.append(transformedCode);
        source.append("\n\n");

        // Helper formatting method
        source.append(generateFormatResultHelper());

        // Helper static state reset
        source.append(generateResetStaticStateHelper());

        // Helper data structure methods
        source.append(generateDataStructureHelpers());

        // Inject main()
        source.append(generateMainMethod(metadata, testCases));

        source.append("\n}\n\n");

        // Data structure classes outside Main (e.g. ListNode)
        source.append(generateDataStructureClasses(userCode));

        return source.toString();
    }

    private String transformUserCode(String code) {
        code = code.replaceFirst(
                "public\\s+class\\s+Solution",
                "public class Main"
        );

        code = code.replaceFirst(
                "class\\s+Solution",
                "public class Main"
        );

        return code;
    }

    private String removeLastBrace(String code) {
        int lastBrace = code.lastIndexOf("}");

        if (lastBrace == -1) {
            return code;
        }

        return code.substring(0, lastBrace);
    }

    private String generateResetStaticStateHelper() {
        return """
                private static void resetStaticState() {
                    try {
                        for (java.lang.reflect.Field f : Main.class.getDeclaredFields()) {
                            if (java.lang.reflect.Modifier.isStatic(f.getModifiers())
                                    && !java.lang.reflect.Modifier.isFinal(f.getModifiers())) {
                                f.setAccessible(true);
                                Class<?> t = f.getType();
                                if (!t.isPrimitive()) {
                                    Object val = f.get(null);
                                    if (val instanceof java.util.Collection) {
                                        ((java.util.Collection<?>) val).clear();
                                    } else if (val instanceof java.util.Map) {
                                        ((java.util.Map<?, ?>) val).clear();
                                    } else {
                                        f.set(null, null);
                                    }
                                } else if (t == int.class || t == long.class || t == short.class || t == byte.class) {
                                    f.set(null, 0);
                                } else if (t == double.class || t == float.class) {
                                    f.set(null, 0.0);
                                } else if (t == boolean.class) {
                                    f.set(null, false);
                                } else if (t == char.class) {
                                    f.set(null, '\\0');
                                }
                            }
                        }
                    } catch (Throwable ignored) {
                    }
                }

            """;
    }

    private String generateFormatResultHelper() {
        return """
                private static String formatResult(Object obj) {
                    if (obj == null) return "null";
                    if (obj instanceof String) {
                        return "\\"" + obj + "\\"";
                    }
                    if (obj instanceof Character) {
                        return "'" + obj + "'";
                    }
                    if (obj instanceof Boolean || obj instanceof Number) {
                        return obj.toString();
                    }
                    if (obj instanceof int[]) {
                        return Arrays.toString((int[]) obj);
                    }
                    if (obj instanceof long[]) {
                        return Arrays.toString((long[]) obj);
                    }
                    if (obj instanceof double[]) {
                        return Arrays.toString((double[]) obj);
                    }
                    if (obj instanceof boolean[]) {
                        return Arrays.toString((boolean[]) obj);
                    }
                    if (obj instanceof char[]) {
                        char[] arr = (char[]) obj;
                        StringBuilder sb = new StringBuilder();
                        sb.append("[");
                        for (int i = 0; i < arr.length; i++) {
                            if (i > 0) sb.append(", ");
                            sb.append("'").append(arr[i]).append("'");
                        }
                        sb.append("]");
                        return sb.toString();
                    }
                    if (obj instanceof Object[]) {
                        StringBuilder sb = new StringBuilder();
                        sb.append("[");
                        Object[] arr = (Object[]) obj;
                        for (int i = 0; i < arr.length; i++) {
                            if (i > 0) sb.append(", ");
                            sb.append(formatResult(arr[i]));
                        }
                        sb.append("]");
                        return sb.toString();
                    }
                    if (obj instanceof Collection<?>) {
                        StringBuilder sb = new StringBuilder();
                        sb.append("[");
                        int i = 0;
                        for (Object item : (Collection<?>) obj) {
                            if (i > 0) sb.append(", ");
                            sb.append(formatResult(item));
                            i++;
                        }
                        sb.append("]");
                        return sb.toString();
                    }
                    if (obj instanceof ListNode) {
                        return formatListNode((ListNode) obj);
                    }
                    return obj.toString();
                }

            """;
    }

    private String generateMainMethod(
            ExecutionMetadata metadata,
            List<TestCase> testCases
    ) {
        StringBuilder builder = new StringBuilder();

        builder.append("    public static void main(String[] args) {\n\n");

        if (testCases != null && !testCases.isEmpty() && metadata != null && metadata.getMethodName() != null) {
            for (TestCase testCase : testCases) {
                builder.append(generateInvocation(metadata, testCase));
            }
        }

        builder.append("    }\n");

        return builder.toString();
    }

    private String generateInvocation(
            ExecutionMetadata metadata,
            TestCase testCase
    ) {
        StringBuilder builder = new StringBuilder();
        String returnType = metadata.getReturnType();
        boolean isVoid = "void".equalsIgnoreCase(returnType);

        List<String> arguments = testCase.getArguments() != null
                ? testCase.getArguments()
                : Collections.emptyList();
        List<String> paramTypes = metadata.getParameterTypes();

        builder.append("        {\n");
        builder.append("            resetStaticState();\n");
        builder.append("            Main solution = new Main();\n");

        if (isVoid) {
            StringBuilder callArgs = new StringBuilder();
            for (int i = 0; i < arguments.size(); i++) {
                String paramType = (paramTypes != null && i < paramTypes.size()) ? paramTypes.get(i) : null;
                String converted = convertArgument(paramType, arguments.get(i));
                String varType = (paramType != null && !paramType.isBlank()) ? paramType : "Object";
                builder.append("            ").append(varType).append(" arg").append(i).append(" = ").append(converted).append(";\n");
                if (i > 0) callArgs.append(", ");
                callArgs.append("arg").append(i);
            }

            builder.append("            solution.").append(metadata.getMethodName()).append("(").append(callArgs).append(");\n");
            if (!arguments.isEmpty()) {
                String firstParam = (paramTypes != null && !paramTypes.isEmpty()) ? paramTypes.get(0) : "";
                if ("ListNode".equals(firstParam)) {
                    builder.append("            System.out.println(formatListNode(arg0));\n");
                } else {
                    builder.append("            System.out.println(formatResult(arg0));\n");
                }
            }
        } else {
            StringBuilder callArgs = new StringBuilder();
            for (int i = 0; i < arguments.size(); i++) {
                String paramType = (paramTypes != null && i < paramTypes.size()) ? paramTypes.get(i) : null;
                String converted = convertArgument(paramType, arguments.get(i));
                if (i > 0) callArgs.append(", ");
                callArgs.append(converted);
            }

            if ("ListNode".equals(returnType)) {
                builder.append("            System.out.println(formatListNode(solution.")
                        .append(metadata.getMethodName())
                        .append("(")
                        .append(callArgs)
                        .append(")));\n");
            } else {
                builder.append("            System.out.println(formatResult(solution.")
                        .append(metadata.getMethodName())
                        .append("(")
                        .append(callArgs)
                        .append(")));\n");
            }
        }

        builder.append("        }\n");

        return builder.toString();
    }

    public String convertArgument(
            String type,
            String value
    ) {
        if (value == null) {
            return "null";
        }

        value = value.trim();
        if (type != null) {
            type = type.replaceAll("\\s+", "");
        }

        if (type == null || type.isBlank()) {
            return inferArgument(value);
        }

        switch (type) {
            case "int":
            case "long":
            case "double":
            case "float":
                return value;

            case "boolean":
                return value.toLowerCase();

            case "String":
                if (value.startsWith("\"") && value.endsWith("\"")) {
                    return value;
                }
                return "\"" + value.replace("\"", "") + "\"";

            case "char":
                if (value.startsWith("'") && value.endsWith("'")) {
                    return value;
                }
                return "'" + value.replace("'", "").replace("\"", "") + "'";

            case "int[]":
                String numbers = value.replace("[", "").replace("]", "").trim();
                if (numbers.isEmpty()) {
                    return "new int[]{}";
                }
                return "new int[]{" + numbers + "}";

            case "long[]":
                String longNums = value.replace("[", "").replace("]", "").trim();
                if (longNums.isEmpty()) {
                    return "new long[]{}";
                }
                return "new long[]{" + longNums + "}";

            case "double[]":
                String dblNums = value.replace("[", "").replace("]", "").trim();
                if (dblNums.isEmpty()) {
                    return "new double[]{}";
                }
                return "new double[]{" + dblNums + "}";

            case "boolean[]":
                String boolVals = value.replace("[", "").replace("]", "").trim();
                if (boolVals.isEmpty()) {
                    return "new boolean[]{}";
                }
                return "new boolean[]{" + boolVals + "}";

            case "String[]":
                String text = value.replace("[", "").replace("]", "").trim();
                if (text.isEmpty()) {
                    return "new String[]{}";
                }
                String[] parts = text.split(",");
                StringBuilder strArrBuilder = new StringBuilder();
                strArrBuilder.append("new String[]{");
                for (int i = 0; i < parts.length; i++) {
                    strArrBuilder.append("\"").append(parts[i].trim().replace("\"", "")).append("\"");
                    if (i != parts.length - 1) {
                        strArrBuilder.append(", ");
                    }
                }
                strArrBuilder.append("}");
                return strArrBuilder.toString();

            case "int[][]":
                if (value.equals("[]") || value.isBlank()) {
                    return "new int[][]{}";
                }
                return "new int[][]" + value.replace("[", "{").replace("]", "}");

            case "char[][]":
                if (value.equals("[]") || value.isBlank()) {
                    return "new char[][]{}";
                }
                return "new char[][]" + value.replace("\"", "'").replace("[", "{").replace("]", "}");

            case "String[][]":
                if (value.equals("[]") || value.isBlank()) {
                    return "new String[][]{}";
                }
                List<String> innersStr = extractBracketedItems(value);
                if (innersStr.isEmpty()) {
                    return "new String[][]" + value.replace("[", "{").replace("]", "}");
                }
                StringBuilder str2dBuilder = new StringBuilder();
                str2dBuilder.append("new String[][]{");
                for (int i = 0; i < innersStr.size(); i++) {
                    String row = innersStr.get(i).replace("[", "").replace("]", "").trim();
                    str2dBuilder.append("{");
                    if (!row.isEmpty()) {
                        String[] items = row.split(",");
                        for (int j = 0; j < items.length; j++) {
                            str2dBuilder.append("\"").append(items[j].trim().replace("\"", "")).append("\"");
                            if (j != items.length - 1) str2dBuilder.append(", ");
                        }
                    }
                    str2dBuilder.append("}");
                    if (i != innersStr.size() - 1) str2dBuilder.append(", ");
                }
                str2dBuilder.append("}");
                return str2dBuilder.toString();

            case "List<Integer>":
            case "ArrayList<Integer>":
                String listNums = value.replace("[", "").replace("]", "").trim();
                if (listNums.isEmpty()) {
                    return "new ArrayList<Integer>()";
                }
                return "new ArrayList<>(Arrays.asList(" + listNums + "))";

            case "List<Long>":
            case "ArrayList<Long>":
                String listLongs = value.replace("[", "").replace("]", "").trim();
                if (listLongs.isEmpty()) {
                    return "new ArrayList<Long>()";
                }
                return "new ArrayList<>(Arrays.asList(" + listLongs + "))";

            case "List<Double>":
            case "ArrayList<Double>":
                String listDbls = value.replace("[", "").replace("]", "").trim();
                if (listDbls.isEmpty()) {
                    return "new ArrayList<Double>()";
                }
                return "new ArrayList<>(Arrays.asList(" + listDbls + "))";

            case "List<String>":
            case "ArrayList<String>":
                String listStrs = value.replace("[", "").replace("]", "").trim();
                if (listStrs.isEmpty()) {
                    return "new ArrayList<String>()";
                }
                String[] listParts = listStrs.split(",");
                StringBuilder listStrBuilder = new StringBuilder();
                listStrBuilder.append("new ArrayList<>(Arrays.asList(");
                for (int i = 0; i < listParts.length; i++) {
                    listStrBuilder.append("\"").append(listParts[i].trim().replace("\"", "")).append("\"");
                    if (i != listParts.length - 1) {
                        listStrBuilder.append(", ");
                    }
                }
                listStrBuilder.append("))");
                return listStrBuilder.toString();

            case "List<List<Integer>>":
                if (value.equals("[]") || value.equals("[[]]") || value.isBlank()) {
                    return "new ArrayList<List<Integer>>()";
                }
                List<String> innersInt = extractBracketedItems(value);
                StringBuilder nestedIntBuilder = new StringBuilder();
                nestedIntBuilder.append("new ArrayList<>(Arrays.asList(");
                for (int i = 0; i < innersInt.size(); i++) {
                    String nums = innersInt.get(i).replace("[", "").replace("]", "").trim();
                    if (nums.isEmpty()) {
                        nestedIntBuilder.append("new ArrayList<Integer>()");
                    } else {
                        nestedIntBuilder.append("Arrays.asList(").append(nums).append(")");
                    }
                    if (i != innersInt.size() - 1) {
                        nestedIntBuilder.append(", ");
                    }
                }
                nestedIntBuilder.append("))");
                return nestedIntBuilder.toString();

            case "List<List<String>>":
                if (value.equals("[]") || value.equals("[[]]") || value.isBlank()) {
                    return "new ArrayList<List<String>>()";
                }
                List<String> innersNestedStr = extractBracketedItems(value);
                StringBuilder nestedStrBuilder = new StringBuilder();
                nestedStrBuilder.append("new ArrayList<>(Arrays.asList(");
                for (int i = 0; i < innersNestedStr.size(); i++) {
                    String row = innersNestedStr.get(i).replace("[", "").replace("]", "").trim();
                    if (row.isEmpty()) {
                        nestedStrBuilder.append("new ArrayList<String>()");
                    } else {
                        String[] items = row.split(",");
                        nestedStrBuilder.append("Arrays.asList(");
                        for (int j = 0; j < items.length; j++) {
                            nestedStrBuilder.append("\"").append(items[j].trim().replace("\"", "")).append("\"");
                            if (j != items.length - 1) nestedStrBuilder.append(", ");
                        }
                        nestedStrBuilder.append(")");
                    }
                    if (i != innersNestedStr.size() - 1) {
                        nestedStrBuilder.append(", ");
                    }
                }
                nestedStrBuilder.append("))");
                return nestedStrBuilder.toString();

            case "ListNode":
                String trimmedNode = value.trim();
                if (trimmedNode.equals("[]") || trimmedNode.equals("null") || trimmedNode.isEmpty()) {
                    return "null";
                }
                return "buildListNode(" + convertArgument("int[]", trimmedNode) + ")";

            case "ListNode[]":
                String trimmedArr = value.trim();
                if (trimmedArr.equals("[]") || trimmedArr.equals("null") || trimmedArr.isEmpty()) {
                    return "new ListNode[]{}";
                }
                return "buildListNodeArray(" + convertArgument("int[][]", trimmedArr) + ")";

            default:
                return value;
        }
    }

    private List<String> extractBracketedItems(String input) {
        List<String> items = new ArrayList<>();
        if (input == null || input.isBlank()) return items;
        int depth = 0;
        StringBuilder current = new StringBuilder();
        for (char c : input.toCharArray()) {
            if (c == '[') {
                depth++;
                if (depth > 1) {
                    current.append(c);
                }
            } else if (c == ']') {
                depth--;
                if (depth >= 1) {
                    current.append(c);
                    if (depth == 1) {
                        items.add(current.toString().trim());
                        current.setLength(0);
                    }
                }
            } else if (depth > 1) {
                current.append(c);
            }
        }
        return items;
    }

    private String inferArgument(String value) {
        if (value.startsWith("[[")) {
            return "new int[][]" + value.replace("[", "{").replace("]", "}");
        }
        if (value.startsWith("[")) {
            if (value.contains("\"")) {
                return convertArgument("String[]", value);
            }
            if (value.equalsIgnoreCase("true") || value.equalsIgnoreCase("false")) {
                return convertArgument("boolean[]", value);
            }
            return convertArgument("int[]", value);
        }
        if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
            return value.toLowerCase();
        }
        return value;
    }

    private String generateDataStructureHelpers() {
        return """
                private static ListNode buildListNode(int[] vals) {
                    if (vals == null || vals.length == 0) return null;
                    ListNode dummy = new ListNode(0);
                    ListNode curr = dummy;
                    for (int v : vals) {
                        curr.next = new ListNode(v);
                        curr = curr.next;
                    }
                    return dummy.next;
                }

                private static ListNode[] buildListNodeArray(int[][] arrs) {
                    if (arrs == null) return new ListNode[]{};
                    ListNode[] res = new ListNode[arrs.length];
                    for (int i = 0; i < arrs.length; i++) {
                        res[i] = buildListNode(arrs[i]);
                    }
                    return res;
                }

                private static String formatListNode(ListNode head) {
                    if (head == null) return "[]";
                    StringBuilder sb = new StringBuilder();
                    sb.append("[");
                    ListNode curr = head;
                    java.util.Set<ListNode> visited = java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>());
                    int count = 0;
                    while (curr != null && count < 10000) {
                        if (!visited.add(curr)) {
                            break;
                        }
                        if (count > 0) sb.append(",");
                        sb.append(curr.val);
                        curr = curr.next;
                        count++;
                    }
                    sb.append("]");
                    return sb.toString();
                }

            """;
    }

    private String generateDataStructureClasses(String userCode) {
        StringBuilder sb = new StringBuilder();
        if (!definesClass(userCode, "ListNode")) {
            sb.append("""
                    class ListNode {
                        public int val;
                        public ListNode next;
                        public ListNode() {}
                        public ListNode(int val) { this.val = val; }
                        public ListNode(int val, ListNode next) { this.val = val; this.next = next; }
                    }
                    """);
        }
        return sb.toString();
    }

    private boolean definesClass(String code, String className) {
        if (code == null) return false;
        String stripped = code.replaceAll("(?s)/\\*.*?\\*/", " ").replaceAll("//.*", " ");
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\bclass\\s+" + java.util.regex.Pattern.quote(className) + "\\b");
        return pattern.matcher(stripped).find();
    }
}