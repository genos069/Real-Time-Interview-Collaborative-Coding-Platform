package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.candidate.codegen.CppDriverGenerator;
import com.interviewplatform.backend.candidate.codegen.JavaDriverGenerator;
import com.interviewplatform.backend.candidate.codegen.PythonDriverGenerator;
import com.interviewplatform.backend.candidate.dto.codeeditor.SubmitCodeResponse;
import com.interviewplatform.backend.candidate.dto.practice.SubmitCodeRequest;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerRequest;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerResponse;
import com.interviewplatform.backend.model.Question;
import com.interviewplatform.backend.model.TestCase;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.QuestionRepository;
import com.interviewplatform.backend.service.UserService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class SubmitCodeService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SubmitCodeService.class);

    // Repositories
    private final QuestionRepository questionRepository;

    // Services
    private final UserService userService;
    private final QuestionSubmissionService questionSubmissionService;
    private final JavaDriverGenerator javaDriverGenerator;
    private final PythonDriverGenerator pythonDriverGenerator;
    private final CppDriverGenerator cppDriverGenerator;

    // Compiler
    private final OnlineCompilerClient onlineCompilerClient;

    // Constructor
    public SubmitCodeService(
            QuestionRepository questionRepository,
            UserService userService,
            QuestionSubmissionService questionSubmissionService,
            JavaDriverGenerator javaDriverGenerator,
            PythonDriverGenerator pythonDriverGenerator,
            CppDriverGenerator cppDriverGenerator,
            OnlineCompilerClient onlineCompilerClient
    ) {
        this.questionRepository = questionRepository;
        this.userService = userService;
        this.questionSubmissionService = questionSubmissionService;
        this.javaDriverGenerator = javaDriverGenerator;
        this.pythonDriverGenerator = pythonDriverGenerator;
        this.cppDriverGenerator = cppDriverGenerator;
        this.onlineCompilerClient = onlineCompilerClient;
    }

    public SubmitCodeResponse submitCode(
            String questionId,
            SubmitCodeRequest request
    ) {

        // Fetch User
        User user = userService.getLoggedInUser();

        // Fetch Question
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // Test Cases
        List<TestCase> testCases = question.getTestCases();

        // Generate Driver
        String sourceCode;

        switch (request.getLanguage().toLowerCase()) {

            case "java":
                sourceCode = javaDriverGenerator.generate(
                        request.getCode(),
                        question.getExecutionMetadata(),
                        testCases
                );
                break;

            case "python":
            case "python3":
                sourceCode = pythonDriverGenerator.generate(
                        request.getCode(),
                        question.getExecutionMetadata(),
                        testCases
                );
                break;

            case "cpp":
            case "c++":
                sourceCode = cppDriverGenerator.generate(
                        request.getCode(),
                        question.getExecutionMetadata(),
                        testCases
                );
                break;

            default:
                throw new IllegalArgumentException(
                        "Unsupported language: " + request.getLanguage()
                );
        }

        // Compiler Request
        OnlineCompilerRequest compilerRequest = new OnlineCompilerRequest();

        compilerRequest.setCompiler(getCompiler(request.getLanguage()));

        compilerRequest.setCode(sourceCode);
        compilerRequest.setInput("");

        // Execute
        OnlineCompilerResponse compilerResponse =
                onlineCompilerClient.execute(compilerRequest);

        SubmitCodeResponse response = new SubmitCodeResponse();

        response.setLanguage(request.getLanguage());
        response.setRuntime(compilerResponse.getExecutionTime());
        response.setMemory(compilerResponse.getMemory());
        response.setSubmittedAt(LocalDateTime.now());


        if (compilerResponse != null) {
            response.setOutput(compilerResponse.getOutput());
            response.setError(compilerResponse.getError());
        }

        String rawOutput = compilerResponse != null && compilerResponse.getOutput() != null
                ? compilerResponse.getOutput().trim()
                : "";
        boolean isCaughtSyntaxError = rawOutput.startsWith("SyntaxError:")
                || rawOutput.startsWith("CompilationError:")
                || rawOutput.startsWith("IndentationError:");

        if (isCaughtSyntaxError) {
            response.setStatus("Compilation Error");
            response.setError(rawOutput);
            response.setOutput(null);
            response.setPassedTestCases(0);
            response.setTotalTestCases(testCases != null ? testCases.size() : 0);

            log.warn("Submit code execution syntax error for question {}: {}", questionId, rawOutput);

            questionSubmissionService.saveSubmission(
                    user.getId(),
                    questionId,
                    request.getLanguage(),
                    request.getCode(),
                    0,
                    testCases != null ? testCases.size() : 0,
                    request.getCodingTimeSeconds()
            );

            return response;
        }

        boolean isSuccess = compilerResponse != null && (
                "success".equalsIgnoreCase(compilerResponse.getStatus()) ||
                (compilerResponse.getExitCode() != null && compilerResponse.getExitCode() == 0)
        );

        // Execution Failure (Compilation Error or Runtime Error)
        if (!isSuccess) {
            String errorMsg = compilerResponse != null && compilerResponse.getError() != null
                    ? compilerResponse.getError()
                    : "";
            Integer exitCode = compilerResponse != null ? compilerResponse.getExitCode() : null;

            boolean isRuntimeError = errorMsg.contains("Exception in thread")
                    || errorMsg.contains("java.lang.")
                    || errorMsg.contains("at Main.")
                    || errorMsg.contains("Internal error:")
                    || (exitCode != null && exitCode > 128);

            boolean isCompilationError = !isRuntimeError && (
                    ((errorMsg.contains(": error:") || errorMsg.startsWith("error:") || errorMsg.contains("error: ") || errorMsg.contains("[ERROR]"))
                     && !errorMsg.contains("Internal error:"))
                    || (exitCode != null && exitCode == 1 && !errorMsg.contains("Exception"))
            );

            response.setStatus(isCompilationError ? "Compilation Error" : "Runtime Error");
            log.warn("Submit code execution not successful for question {}: status={}, exitCode={}, error={}, output={}",
                    questionId, compilerResponse != null ? compilerResponse.getStatus() : null, exitCode, errorMsg,
                    compilerResponse != null ? compilerResponse.getOutput() : null);
            response.setPassedTestCases(0);
            response.setTotalTestCases(testCases != null ? testCases.size() : 0);

            questionSubmissionService.saveSubmission(
                    user.getId(),
                    questionId,
                    request.getLanguage(),
                    request.getCode(),
                    0,
                    testCases != null ? testCases.size() : 0,
                    request.getCodingTimeSeconds()
            );

            return response;
        }

        // Judge Output
        String output = compilerResponse.getOutput() == null
                ? ""
                : compilerResponse.getOutput().trim();

        String[] actualOutputs = output.split("\\R");

        log.debug("Judge execution for question {}: testCases={}, actualOutputs={}", questionId, testCases.size(), actualOutputs.length);

        int passed = 0;

        for (int i = 0; i < testCases.size() && i < actualOutputs.length; i++) {

            String expected = testCases.get(i)
                    .getExpectedOutput()
                    .replaceAll("\\s+", "")
                    .trim();

            String actual = actualOutputs[i]
                    .replaceAll("\\s+", "")
                    .trim();

            boolean matched = compareOutputs(expected, actual, question);

            if (matched) {
                passed++;
            }
        }

        // Build Response
        response.setPassedTestCases(passed);
        response.setTotalTestCases(testCases.size());

        if (passed == testCases.size()) {
            response.setStatus("Accepted");
        } else {
            response.setStatus("Wrong Answer");
        }

// Save Submission
        questionSubmissionService.saveSubmission(
                user.getId(),
                questionId,
                request.getLanguage(),
                request.getCode(),
                passed,
                testCases.size(),
                request.getCodingTimeSeconds()
        );

        return response;
    }

    private boolean compareOutputs(String expected, String actual, Question question) {
        if (expected.equals(actual)) {
            return true;
        }

        if (expected.equalsIgnoreCase(actual)) {
            return true;
        }

        try {
            double expectedNumber = Double.parseDouble(expected);
            double actualNumber = Double.parseDouble(actual);
            return Math.abs(expectedNumber - actualNumber) < 1e-9;
        } catch (NumberFormatException ignored) {
        }

        boolean allowsAnyOrder = question != null && (
                (question.getDescription() != null && question.getDescription().toLowerCase().contains("any order"))
                || (question.getSlug() != null && (
                        question.getSlug().contains("n-queens")
                        || question.getSlug().contains("subsets")
                        || question.getSlug().contains("permutations")
                        || question.getSlug().contains("combination-sum")
                ))
        );

        if (allowsAnyOrder) {
            return compareUnordered(expected, actual);
        }

        return false;
    }

    private boolean compareUnordered(String expected, String actual) {
        if (!expected.startsWith("[") || !expected.endsWith("]")
                || !actual.startsWith("[") || !actual.endsWith("]")) {
            return false;
        }

        List<String> expectedItems = extractTopLevelItems(expected);
        List<String> actualItems = extractTopLevelItems(actual);

        if (expectedItems.size() != actualItems.size()) {
            return false;
        }

        Collections.sort(expectedItems);
        Collections.sort(actualItems);

        return expectedItems.equals(actualItems);
    }

    private List<String> extractTopLevelItems(String input) {
        List<String> items = new ArrayList<>();
        if (input == null || input.length() <= 2) {
            return items;
        }

        String inner = input.substring(1, input.length() - 1).trim();
        if (inner.isEmpty()) {
            return items;
        }

        int depth = 0;
        StringBuilder current = new StringBuilder();

        for (char c : inner.toCharArray()) {
            if (c == '[' || c == '{' || c == '(') {
                depth++;
                current.append(c);
            } else if (c == ']' || c == '}' || c == ')') {
                depth--;
                current.append(c);
            } else if (c == ',' && depth == 0) {
                String item = current.toString().trim();
                if (!item.isEmpty()) {
                    items.add(item);
                }
                current.setLength(0);
            } else {
                current.append(c);
            }
        }

        String item = current.toString().trim();
        if (!item.isEmpty()) {
            items.add(item);
        }

        return items;
    }

    // Compiler
    private String getCompiler(String language) {

        switch (language.toLowerCase()) {

            case "java":
                return "openjdk-25";

            case "python":
            case "python3":
                return "python-3.14";

            case "cpp":
            case "c++":
                return "g++-15";

            default:
                throw new IllegalArgumentException(
                        "Unsupported language: " + language
                );
        }
    }

}