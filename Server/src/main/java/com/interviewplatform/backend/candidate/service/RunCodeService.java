package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.candidate.dto.codeeditor.RunCodeRequest;
import com.interviewplatform.backend.candidate.dto.codeeditor.RunCodeResponse;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerRequest;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerResponse;
import com.interviewplatform.backend.model.Question;
import com.interviewplatform.backend.repository.QuestionRepository;
import org.springframework.stereotype.Service;
import com.interviewplatform.backend.candidate.codegen.CppDriverGenerator;
import com.interviewplatform.backend.candidate.codegen.JavaDriverGenerator;
import com.interviewplatform.backend.candidate.codegen.PythonDriverGenerator;
import com.interviewplatform.backend.model.TestCase;

import java.util.List;

@Service
public class RunCodeService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RunCodeService.class);

    private final OnlineCompilerClient onlineCompilerClient;
    private final QuestionRepository questionRepository;
    private final JavaDriverGenerator javaDriverGenerator;
    private final PythonDriverGenerator pythonDriverGenerator;
    private final CppDriverGenerator cppDriverGenerator;

    public RunCodeService(
            OnlineCompilerClient onlineCompilerClient,
            QuestionRepository questionRepository,
            JavaDriverGenerator javaDriverGenerator,
            PythonDriverGenerator pythonDriverGenerator,
            CppDriverGenerator cppDriverGenerator
    ) {
        this.onlineCompilerClient = onlineCompilerClient;
        this.questionRepository = questionRepository;
        this.javaDriverGenerator = javaDriverGenerator;
        this.pythonDriverGenerator = pythonDriverGenerator;
        this.cppDriverGenerator = cppDriverGenerator;
    }

    public RunCodeResponse executeCode(RunCodeRequest request) {

        // Validate Request
        if (request.getQuestionId() == null || request.getQuestionId().isBlank()) {
            throw new IllegalArgumentException("Question ID is required.");
        }

        if (request.getLanguage() == null || request.getLanguage().isBlank()) {
            throw new IllegalArgumentException("Programming language is required.");
        }

        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new IllegalArgumentException("Source code is required.");
        }

        // Fetch Question
        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found."));

        // Test Cases
        List<TestCase> testCases = question.getTestCases();

        // Build Compiler Request
        OnlineCompilerRequest compilerRequest = new OnlineCompilerRequest();
        compilerRequest.setCompiler(getCompiler(request.getLanguage()));
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

        compilerRequest.setCode(sourceCode);
        compilerRequest.setInput(
                request.getInput() == null ? "" : request.getInput()
        );

        // Execute Code
        OnlineCompilerResponse compilerResponse =
                onlineCompilerClient.execute(compilerRequest);

        // Build Response
        RunCodeResponse response = new RunCodeResponse();

        boolean isSuccess = compilerResponse != null && (
                "success".equalsIgnoreCase(compilerResponse.getStatus()) ||
                (compilerResponse.getExitCode() != null && compilerResponse.getExitCode() == 0)
        );

        if (compilerResponse != null) {
            response.setOutput(compilerResponse.getOutput());
            response.setError(compilerResponse.getError());
            response.setRuntime(compilerResponse.getExecutionTime());
            response.setMemory(compilerResponse.getMemory());

            String rawOutput = compilerResponse.getOutput() != null ? compilerResponse.getOutput().trim() : "";
            boolean isCaughtSyntaxError = rawOutput.startsWith("SyntaxError:")
                    || rawOutput.startsWith("CompilationError:")
                    || rawOutput.startsWith("IndentationError:");

            if (isCaughtSyntaxError) {
                response.setStatus("Compilation Error");
                response.setError(rawOutput);
                response.setOutput(null);
                log.warn("Run code execution syntax error for question {}: {}", request.getQuestionId(), rawOutput);
            } else if (isSuccess) {
                response.setStatus("success");
            } else {
                String errorMsg = compilerResponse.getError() != null ? compilerResponse.getError() : "";
                Integer exitCode = compilerResponse.getExitCode();

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
                log.warn("Run code execution not successful for question {}: status={}, exitCode={}, error={}, output={}",
                        request.getQuestionId(), compilerResponse.getStatus(), exitCode, errorMsg, compilerResponse.getOutput());
            }
        } else {
            response.setStatus("Runtime Error");
            response.setError("No response received from compiler service");
        }

        // Example test case count (Run does not judge)
        response.setPassedTestCases(0);
        response.setTotalTestCases(
                question.getTestCases() == null
                        ? 0
                        : question.getTestCases().size()
        );

        return response;
    }

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