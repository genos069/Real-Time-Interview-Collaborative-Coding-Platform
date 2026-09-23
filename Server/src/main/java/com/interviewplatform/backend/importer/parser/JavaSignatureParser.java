package com.interviewplatform.backend.importer.parser;

import com.interviewplatform.backend.model.ExecutionMetadata;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JavaSignatureParser {

    private static final Pattern CLASS_PATTERN =
            Pattern.compile("class\\s+(\\w+)");

    private static final Pattern METHOD_PATTERN =
            Pattern.compile(
                    "public\\s+([a-zA-Z0-9_\\[\\]<>,\\s]+?)\\s+([a-zA-Z0-9_]+)\\s*\\(([^)]*)\\)"
            );

    public ExecutionMetadata parse(String javaCode) {

        ExecutionMetadata metadata = new ExecutionMetadata();
        String cleanCode = stripComments(javaCode);

        // Class Name
        Matcher classMatcher = CLASS_PATTERN.matcher(cleanCode);

        if (classMatcher.find()) {
            metadata.setClassName(classMatcher.group(1));
        }

        // Method Signature
        Matcher methodMatcher = METHOD_PATTERN.matcher(cleanCode);

        if (methodMatcher.find()) {

            // Return Type (normalized)
            String returnType = methodMatcher.group(1).trim().replaceAll("\\s+", "");
            metadata.setReturnType(returnType);

            // Method Name
            metadata.setMethodName(methodMatcher.group(2).trim());

            // Parameters
            String parameters = methodMatcher.group(3).trim();

            List<String> parameterTypes = new ArrayList<>();
            List<String> parameterNames = new ArrayList<>();

            if (!parameters.isEmpty()) {

                List<String> params = splitParameters(parameters);

                for (String parameter : params) {

                    parameter = parameter.trim();

                    int lastSpace = parameter.lastIndexOf(' ');

                    if (lastSpace != -1) {

                        String type = parameter.substring(0, lastSpace).trim().replaceAll("\\s+", "");
                        String name = parameter.substring(lastSpace + 1).trim();

                        parameterTypes.add(type);
                        parameterNames.add(name);
                    }
                }
            }

            metadata.setParameterTypes(parameterTypes);
            metadata.setParameterNames(parameterNames);
        }

        return metadata;
    }

    private List<String> splitParameters(String parameters) {

        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int genericDepth = 0;
        int bracketDepth = 0;

        for (char c : parameters.toCharArray()) {

            if (c == '<') {
                genericDepth++;
            } else if (c == '>') {
                genericDepth--;
            } else if (c == '[') {
                bracketDepth++;
            } else if (c == ']') {
                bracketDepth--;
            } else if (c == ',' && genericDepth == 0 && bracketDepth == 0) {

                String token = current.toString().trim();
                if (!token.isEmpty()) {
                    result.add(token);
                }
                current.setLength(0);
                continue;
            }

            current.append(c);
        }

        String token = current.toString().trim();
        if (!token.isEmpty()) {
            result.add(token);
        }

        return result;
    }

    private String stripComments(String code) {
        if (code == null) {
            return "";
        }
        return code.replaceAll("(?s)/\\*.*?\\*/", " ").replaceAll("//.*", " ");
    }
}