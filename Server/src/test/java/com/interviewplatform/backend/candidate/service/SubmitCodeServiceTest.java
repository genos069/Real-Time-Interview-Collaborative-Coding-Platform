package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.candidate.codegen.CppDriverGenerator;
import com.interviewplatform.backend.candidate.codegen.JavaDriverGenerator;
import com.interviewplatform.backend.candidate.codegen.PythonDriverGenerator;
import com.interviewplatform.backend.candidate.dto.codeeditor.SubmitCodeResponse;
import com.interviewplatform.backend.candidate.dto.practice.SubmitCodeRequest;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerRequest;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerResponse;
import com.interviewplatform.backend.model.ExecutionMetadata;
import com.interviewplatform.backend.model.Question;
import com.interviewplatform.backend.model.TestCase;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.QuestionRepository;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmitCodeServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private UserService userService;

    @Mock
    private QuestionSubmissionService questionSubmissionService;

    @Mock
    private JavaDriverGenerator javaDriverGenerator;

    @Mock
    private PythonDriverGenerator pythonDriverGenerator;

    @Mock
    private OnlineCompilerClient onlineCompilerClient;

    private CppDriverGenerator cppDriverGenerator;
    private SubmitCodeService submitCodeService;

    private Question twoSumQuestion;
    private User testUser;

    @BeforeEach
    void setUp() {
        cppDriverGenerator = new CppDriverGenerator();
        submitCodeService = new SubmitCodeService(
                questionRepository,
                userService,
                questionSubmissionService,
                javaDriverGenerator,
                pythonDriverGenerator,
                cppDriverGenerator,
                onlineCompilerClient
        );

        testUser = new User();
        testUser.setId("user-1");
        testUser.setEmail("candidate@test.com");

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

        TestCase tc2 = new TestCase();
        tc2.setArguments(List.of("[3,2,4]", "6"));
        tc2.setExpectedOutput("[1,2]");

        TestCase tc3 = new TestCase();
        tc3.setArguments(List.of("[3,3]", "6"));
        tc3.setExpectedOutput("[0,1]");

        twoSumQuestion.setTestCases(List.of(tc1, tc2, tc3));
    }

    @Test
    void submitCode_CorrectTwoSumWithCompilerWarnings_ReturnsAcceptedAndPopulatesOutput() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        // Online compiler returns status "success", exitCode 0, correct outputs, and a compiler warning in error
        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("success");
        compilerResponse.setExitCode(0);
        compilerResponse.setOutput("[0,1]\n[1,2]\n[0,1]\n");
        compilerResponse.setError("warning: comparison of integer expressions of different signedness [-Wsign-compare]");
        compilerResponse.setExecutionTime("0.02");
        compilerResponse.setMemory("6500");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("cpp");
        request.setCode("""
                class Solution {
                public:
                    vector<int> twoSum(vector<int>& nums, int target) {
                        unordered_map<int, int> mp;
                        for (int i = 0; i < nums.size(); i++) {
                            int complement = target - nums[i];
                            if (mp.find(complement) != mp.end()) return {mp[complement], i};
                            mp[nums[i]] = i;
                        }
                        return {};
                    }
                };
                """);
        request.setCodingTimeSeconds(120);

        SubmitCodeResponse response = submitCodeService.submitCode("q-twosum", request);

        assertEquals("Accepted", response.getStatus());
        assertEquals(3, response.getPassedTestCases());
        assertEquals(3, response.getTotalTestCases());
        assertNotNull(response.getOutput());
        assertTrue(response.getOutput().contains("[0,1]"));
        assertNotNull(response.getError());

        verify(questionSubmissionService, times(1)).saveSubmission(
                eq("user-1"), eq("q-twosum"), eq("cpp"), anyString(), eq(3), eq(3), eq(120L)
        );
    }

    @Test
    void submitCode_IncorrectTwoSum_ReturnsWrongAnswer() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("success");
        compilerResponse.setExitCode(0);
        compilerResponse.setOutput("[99,99]\n[99,99]\n[99,99]\n");
        compilerResponse.setExecutionTime("0.02");
        compilerResponse.setMemory("6500");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("cpp");
        request.setCode("class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {99,99}; } };");
        request.setCodingTimeSeconds(50);

        SubmitCodeResponse response = submitCodeService.submitCode("q-twosum", request);

        assertEquals("Wrong Answer", response.getStatus());
        assertEquals(0, response.getPassedTestCases());
        assertEquals(3, response.getTotalTestCases());

        verify(questionSubmissionService, times(1)).saveSubmission(
                eq("user-1"), eq("q-twosum"), eq("cpp"), anyString(), eq(0), eq(3), eq(50L)
        );
    }

    @Test
    void submitCode_CompilationError_ReturnsCompilationErrorStatus() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("error");
        compilerResponse.setExitCode(1);
        compilerResponse.setOutput("");
        compilerResponse.setError("code.cc:10:5: error: expected ';' before '}' token");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("cpp");
        request.setCode("invalid cpp code");
        request.setCodingTimeSeconds(30);

        SubmitCodeResponse response = submitCodeService.submitCode("q-twosum", request);

        assertEquals("Compilation Error", response.getStatus());
        assertEquals(0, response.getPassedTestCases());
        assertEquals(3, response.getTotalTestCases());
        assertEquals("code.cc:10:5: error: expected ';' before '}' token", response.getError());
    }

    @Test
    void submitCode_RuntimeError_ReturnsRuntimeErrorStatus() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("error");
        compilerResponse.setExitCode(-1);
        compilerResponse.setOutput("");
        compilerResponse.setError("Internal error: code execution failed");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("cpp");
        request.setCode("class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { throw runtime_error(\"crash\"); } };");
        request.setCodingTimeSeconds(40);

        SubmitCodeResponse response = submitCodeService.submitCode("q-twosum", request);

        assertEquals("Runtime Error", response.getStatus());
        assertEquals(0, response.getPassedTestCases());
        assertEquals(3, response.getTotalTestCases());
        assertEquals("Internal error: code execution failed", response.getError());
    }

    @Test
    void submitCode_JavaRuntimeErrorWithExitCode1_ReturnsRuntimeErrorStatus() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("error");
        compilerResponse.setExitCode(1); // Exit code 1 from JVM on uncaught exception!
        compilerResponse.setOutput("");
        compilerResponse.setError("Exception in thread \"main\" java.lang.NullPointerException: Cannot invoke \"String.length()\"\n\tat Main.twoSum(Main.java:25)");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("java");
        request.setCode("class Solution { public int[] twoSum(int[] nums, int target) { String s = null; s.length(); return new int[]{0, 1}; } }");
        request.setCodingTimeSeconds(25);

        SubmitCodeResponse response = submitCodeService.submitCode("q-twosum", request);

        assertEquals("Runtime Error", response.getStatus());
        assertEquals(0, response.getPassedTestCases());
        assertEquals(3, response.getTotalTestCases());
        assertTrue(response.getError().contains("java.lang.NullPointerException"));
    }

    @Test
    void submitCode_NQueensUnorderedSolutions_ReturnsAccepted() {
        Question nqueensQuestion = new Question();
        nqueensQuestion.setId("q-nqueens");
        nqueensQuestion.setSlug("n-queens");
        nqueensQuestion.setTitle("N-Queens");
        nqueensQuestion.setDescription("Given an integer n, return all distinct solutions to the n-queens puzzle. You may return the answer in any order.");

        TestCase tc1 = new TestCase();
        tc1.setArguments(List.of("4"));
        tc1.setExpectedOutput("[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]");

        nqueensQuestion.setTestCases(List.of(tc1));

        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-nqueens")).thenReturn(Optional.of(nqueensQuestion));

        // Actual output returned the two boards in reversed order!
        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("success");
        compilerResponse.setExitCode(0);
        compilerResponse.setOutput("[[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"],[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"]]\n");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("java");
        request.setCode("class Solution { public List<List<String>> solveNQueens(int n) { ... } }");
        request.setCodingTimeSeconds(60);

        SubmitCodeResponse response = submitCodeService.submitCode("q-nqueens", request);

        assertEquals("Accepted", response.getStatus());
        assertEquals(1, response.getPassedTestCases());
        assertEquals(1, response.getTotalTestCases());
    }

    @Test
    void submitCode_OrderSensitiveDifferentOrder_ReturnsWrongAnswer() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        // Two Sum expected [0, 1] but candidate returned [1, 0]
        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("success");
        compilerResponse.setExitCode(0);
        compilerResponse.setOutput("[1,0]\n[2,1]\n[1,0]\n");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("java");
        request.setCode("class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{1, 0}; } }");
        request.setCodingTimeSeconds(45);

        SubmitCodeResponse response = submitCodeService.submitCode("q-twosum", request);

        assertEquals("Wrong Answer", response.getStatus());
        assertEquals(0, response.getPassedTestCases());
    }

    @Test
    void submitCode_Python_Accepted() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("success");
        compilerResponse.setExitCode(0);
        compilerResponse.setOutput("[0,1]\n[1,2]\n[0,1]\n");
        compilerResponse.setExecutionTime("0.25");
        compilerResponse.setMemory("22000");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("python");
        request.setCode("""
                class Solution:
                    def twoSum(self, nums: List[int], target: int) -> List[int]:
                        return [0, 1]
                """);
        request.setCodingTimeSeconds(90);

        SubmitCodeResponse response = submitCodeService.submitCode("q-twosum", request);

        assertEquals("Accepted", response.getStatus());
        assertEquals(3, response.getPassedTestCases());
        assertEquals(3, response.getTotalTestCases());

        verify(questionSubmissionService, times(1)).saveSubmission(
                eq("user-1"), eq("q-twosum"), eq("python"), anyString(), eq(3), eq(3), eq(90L)
        );
    }

    @Test
    void submitCode_Python_SyntaxError_ReturnsCompilationError() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findById("q-twosum")).thenReturn(Optional.of(twoSumQuestion));

        OnlineCompilerResponse compilerResponse = new OnlineCompilerResponse();
        compilerResponse.setStatus("success");
        compilerResponse.setExitCode(0);
        compilerResponse.setOutput("SyntaxError: '(' was never closed (<string>, line 2)\n");

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(compilerResponse);

        SubmitCodeRequest request = new SubmitCodeRequest();
        request.setLanguage("python");
        request.setCode("class Solution:\n    def twoSum(self, nums");
        request.setCodingTimeSeconds(30);

        SubmitCodeResponse response = submitCodeService.submitCode("q-twosum", request);

        assertEquals("Compilation Error", response.getStatus());
        assertEquals(0, response.getPassedTestCases());
        assertEquals(3, response.getTotalTestCases());
        assertNotNull(response.getError());
        assertTrue(response.getError().contains("SyntaxError"));

        verify(questionSubmissionService, times(1)).saveSubmission(
                eq("user-1"), eq("q-twosum"), eq("python"), anyString(), eq(0), eq(3), eq(30L)
        );
    }
}


