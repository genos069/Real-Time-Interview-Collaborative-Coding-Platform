package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.candidate.codegen.CppDriverGenerator;
import com.interviewplatform.backend.candidate.codegen.JavaDriverGenerator;
import com.interviewplatform.backend.candidate.codegen.PythonDriverGenerator;
import com.interviewplatform.backend.candidate.dto.codeeditor.RunCodeRequest;
import com.interviewplatform.backend.candidate.dto.codeeditor.RunCodeResponse;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerRequest;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerResponse;
import com.interviewplatform.backend.model.ExecutionMetadata;
import com.interviewplatform.backend.model.Question;
import com.interviewplatform.backend.model.TestCase;
import com.interviewplatform.backend.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RunCodeServiceTest {

    @Mock
    private OnlineCompilerClient onlineCompilerClient;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private JavaDriverGenerator javaDriverGenerator;

    @Mock
    private PythonDriverGenerator pythonDriverGenerator;

    private CppDriverGenerator cppDriverGenerator;
    private RunCodeService runCodeService;

    private Question twoSumQuestion;

    @BeforeEach
    void setUp() {
        cppDriverGenerator = new CppDriverGenerator();
        runCodeService = new RunCodeService(
                onlineCompilerClient,
                questionRepository,
                javaDriverGenerator,
                pythonDriverGenerator,
                cppDriverGenerator
        );

        twoSumQuestion = new Question();
        twoSumQuestion.setId("q-twosum");
        twoSumQuestion.setTitle("Two Sum");

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("twoSum");
        metadata.setReturnType("int[]");
        metadata.setParameterTypes(List.of("int[]", "int"));
        twoSumQuestion.setExecutionMetadata(metadata);

        TestCase tc1 = new TestCase();
        tc1.setArguments(List.of("[2,7,11,15]", "9"));
        tc1.setExpectedOutput("[0,1]");

        twoSumQuestion.setTestCases(List.of(tc1));
    }

    @Test
    void executeCode_Success_ReturnsSuccessStatusAndOutput() {
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("success");
        compilerResponse.setExitCode(0);
        compilerResponse.setOutput("[0,1]\n");
        compilerResponse.setError("warning: comparison of integer expressions [-Wsign-compare]");
        compilerResponse.setExecutionTime("0.02");
        compilerResponse.setMemory("6500");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        RunCodeRequest req = new RunCodeRequest();
        req.setQuestionId("q-twosum");
        req.setLanguage("cpp");
        req.setCode("class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {0,1}; } };");

        RunCodeResponse response = runCodeService.executeCode(req);

        assertEquals("success", response.getStatus());
        assertEquals("[0,1]\n", response.getOutput());
        assertNotNull(response.getError());
    }

    @Test
    void executeCode_CompilationError_ReturnsCompilationErrorStatus() {
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("error");
        compilerResponse.setExitCode(1);
        compilerResponse.setError("error: missing semicolon");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        RunCodeRequest req = new RunCodeRequest();
        req.setQuestionId("q-twosum");
        req.setLanguage("cpp");
        req.setCode("syntax error");

        RunCodeResponse response = runCodeService.executeCode(req);

        assertEquals("Compilation Error", response.getStatus());
        assertEquals("error: missing semicolon", response.getError());
    }

    @Test
    void executeCode_RuntimeError_ReturnsRuntimeErrorStatus() {
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("error");
        compilerResponse.setExitCode(-1);
        compilerResponse.setError("Internal error: code execution failed");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        RunCodeRequest req = new RunCodeRequest();
        req.setQuestionId("q-twosum");
        req.setLanguage("cpp");
        req.setCode("crash code");

        RunCodeResponse response = runCodeService.executeCode(req);

        assertEquals("Runtime Error", response.getStatus());
        assertEquals("Internal error: code execution failed", response.getError());
    }

    @Test
    void executeCode_Python_SyntaxError_ReturnsCompilationErrorStatus() {
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("success");
        compilerResponse.setExitCode(0);
        compilerResponse.setOutput("SyntaxError: invalid syntax (<string>, line 1)\n");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        RunCodeRequest req = new RunCodeRequest();
        req.setQuestionId("q-twosum");
        req.setLanguage("python");
        req.setCode("def foo(");

        RunCodeResponse response = runCodeService.executeCode(req);

        assertEquals("Compilation Error", response.getStatus());
        assertTrue(response.getError().contains("SyntaxError"));
        assertNull(response.getOutput());
    }
}

