package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerRequest;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerResponse;
import com.interviewplatform.backend.interview.dto.RunInterviewCodeRequest;
import com.interviewplatform.backend.interview.dto.RunInterviewCodeResponse;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.service.InterviewService;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClientException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewCodeExecutionTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private OnlineCompilerClient onlineCompilerClient;

    private InterviewService interviewService;

    @BeforeEach
    void setUp() {
        interviewService = new InterviewService(
                interviewRepository,
                userRepository,
                userService,
                onlineCompilerClient
        );
    }

    private Interview createActiveRoom() {
        Interview interview = new Interview();
        interview.setRoomId("INT-TEST1234");
        interview.setStatus("ACTIVE");
        interview.setCandidateId("cand-111");
        interview.setInterviewerId("intv-222");
        return interview;
    }

    private User createCandidateUser() {
        User user = new User();
        user.setId("cand-111");
        user.setRole("candidate");
        return user;
    }

    private User createInterviewerUser() {
        User user = new User();
        user.setId("intv-222");
        user.setRole("interviewer");
        return user;
    }

    @Test
    void runCode_RoomNotFound_ThrowsNotFound() {
        when(interviewRepository.findByRoomId("NON-EXISTENT")).thenReturn(Optional.empty());

        RunInterviewCodeRequest req = new RunInterviewCodeRequest("Java", "public class Main {}", "");
        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.runCode("NON-EXISTENT", req)
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Interview room not found", ex.getMessage());
    }

    @Test
    void runCode_InactiveRoom_ThrowsBadRequest() {
        Interview interview = createActiveRoom();
        interview.setStatus("COMPLETED");
        when(interviewRepository.findByRoomId("INT-TEST1234")).thenReturn(Optional.of(interview));

        RunInterviewCodeRequest req = new RunInterviewCodeRequest("Java", "public class Main {}", "");
        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.runCode("INT-TEST1234", req)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Interview room is not active", ex.getMessage());
    }

    @Test
    void runCode_UnauthorizedUser_ThrowsForbidden() {
        Interview interview = createActiveRoom();
        when(interviewRepository.findByRoomId("INT-TEST1234")).thenReturn(Optional.of(interview));

        User unauthorized = new User();
        unauthorized.setId("outsider-999");
        unauthorized.setRole("candidate");
        when(userService.getLoggedInUser()).thenReturn(unauthorized);

        RunInterviewCodeRequest req = new RunInterviewCodeRequest("Java", "public class Main {}", "");
        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.runCode("INT-TEST1234", req)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("You are not authorized to access this interview room", ex.getMessage());
    }

    @Test
    void runCode_UnsupportedLanguage_ThrowsIllegalArgumentException() {
        Interview interview = createActiveRoom();
        when(interviewRepository.findByRoomId("INT-TEST1234")).thenReturn(Optional.of(interview));
        when(userService.getLoggedInUser()).thenReturn(createCandidateUser());

        RunInterviewCodeRequest req = new RunInterviewCodeRequest("Rust", "fn main() {}", "");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                interviewService.runCode("INT-TEST1234", req)
        );

        assertTrue(ex.getMessage().contains("Unsupported language"));
    }

    @Test
    void runCode_MissingLanguageOrCode_ThrowsIllegalArgumentException() {
        RunInterviewCodeRequest req1 = new RunInterviewCodeRequest("", "some code", "");
        assertThrows(IllegalArgumentException.class, () -> interviewService.runCode("INT-TEST1234", req1));

        RunInterviewCodeRequest req2 = new RunInterviewCodeRequest("Java", "   ", "");
        assertThrows(IllegalArgumentException.class, () -> interviewService.runCode("INT-TEST1234", req2));
    }

    @Test
    void runCode_Java_MapsToOpenJdk25AndPassesCompleteSourceDirectly() {
        Interview interview = createActiveRoom();
        when(interviewRepository.findByRoomId("INT-TEST1234")).thenReturn(Optional.of(interview));
        when(userService.getLoggedInUser()).thenReturn(createCandidateUser());

        String completeJavaCode = "public class Main { public static void main(String[] args) { System.out.println(\"HELLO\"); } }";
        RunInterviewCodeRequest req = new RunInterviewCodeRequest("Java", completeJavaCode, "test input");

        OnlineCompilerResponse mockResponse = new OnlineCompilerResponse();
        mockResponse.setStatus("success");
        mockResponse.setOutput("HELLO\n");
        mockResponse.setError("");
        mockResponse.setExitCode(0);
        mockResponse.setExecutionTime("0.08");
        mockResponse.setMemory("24MB");
        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(mockResponse);

        RunInterviewCodeResponse result = interviewService.runCode("INT-TEST1234", req);

        ArgumentCaptor<OnlineCompilerRequest> captor = ArgumentCaptor.forClass(OnlineCompilerRequest.class);
        verify(onlineCompilerClient).execute(captor.capture());
        OnlineCompilerRequest capturedReq = captor.getValue();

        assertEquals("openjdk-25", capturedReq.getCompiler());
        assertEquals(completeJavaCode, capturedReq.getCode());
        assertEquals("test input", capturedReq.getInput());

        assertNotNull(result);
        assertEquals("success", result.getStatus());
        assertEquals("HELLO\n", result.getOutput());
        assertEquals(0, result.getExitCode());
        assertEquals("0.08", result.getExecutionTime());
    }

    @Test
    void runCode_Python_MapsToPython314AndAllowsInterviewer() {
        Interview interview = createActiveRoom();
        when(interviewRepository.findByRoomId("INT-TEST1234")).thenReturn(Optional.of(interview));
        when(userService.getLoggedInUser()).thenReturn(createInterviewerUser());

        String completePythonCode = "print('PY_TEST')";
        RunInterviewCodeRequest req = new RunInterviewCodeRequest("Python", completePythonCode, null);

        OnlineCompilerResponse mockResponse = new OnlineCompilerResponse();
        mockResponse.setStatus("success");
        mockResponse.setOutput("PY_TEST\n");
        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(mockResponse);

        RunInterviewCodeResponse result = interviewService.runCode("INT-TEST1234", req);

        ArgumentCaptor<OnlineCompilerRequest> captor = ArgumentCaptor.forClass(OnlineCompilerRequest.class);
        verify(onlineCompilerClient).execute(captor.capture());
        OnlineCompilerRequest capturedReq = captor.getValue();

        assertEquals("python-3.14", capturedReq.getCompiler());
        assertEquals(completePythonCode, capturedReq.getCode());
        assertEquals("", capturedReq.getInput());

        assertEquals("PY_TEST\n", result.getOutput());
    }

    @Test
    void runCode_Cpp_MapsToGpp15() {
        Interview interview = createActiveRoom();
        when(interviewRepository.findByRoomId("INT-TEST1234")).thenReturn(Optional.of(interview));
        when(userService.getLoggedInUser()).thenReturn(createCandidateUser());

        String completeCppCode = "#include <iostream>\nint main() { std::cout << 42; return 0; }";
        RunInterviewCodeRequest req = new RunInterviewCodeRequest("C++", completeCppCode, "");

        OnlineCompilerResponse mockResponse = new OnlineCompilerResponse();
        mockResponse.setStatus("success");
        mockResponse.setOutput("42");
        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(mockResponse);

        RunInterviewCodeResponse result = interviewService.runCode("INT-TEST1234", req);

        ArgumentCaptor<OnlineCompilerRequest> captor = ArgumentCaptor.forClass(OnlineCompilerRequest.class);
        verify(onlineCompilerClient).execute(captor.capture());
        assertEquals("g++-15", captor.getValue().getCompiler());
        assertEquals(completeCppCode, captor.getValue().getCode());
        assertEquals("42", result.getOutput());
    }

    @Test
    void runCode_CompilerServiceFails_ReturnsSafeStructuredResponse() {
        Interview interview = createActiveRoom();
        when(interviewRepository.findByRoomId("INT-TEST1234")).thenReturn(Optional.of(interview));
        when(userService.getLoggedInUser()).thenReturn(createCandidateUser());

        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class)))
                .thenThrow(new RestClientException("Connection refused to external compiler"));

        RunInterviewCodeRequest req = new RunInterviewCodeRequest("Java", "public class Main {}", "");
        RunInterviewCodeResponse result = interviewService.runCode("INT-TEST1234", req);

        assertNotNull(result);
        assertEquals("ERROR", result.getStatus());
        assertTrue(result.getError().contains("Compiler service communication error"));
    }

    @Test
    void runCode_Java_HelperClassBeforePublicMain_ReordersMainFirstForCompiler() {
        Interview interview = createActiveRoom();
        when(interviewRepository.findByRoomId("INT-TEST1234")).thenReturn(Optional.of(interview));
        when(userService.getLoggedInUser()).thenReturn(createCandidateUser());

        String originalCode =
                "class Node {\n" +
                "    int data;\n" +
                "    Node(int data) {\n" +
                "        this.data = data;\n" +
                "    }\n" +
                "}\n" +
                "\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        Node node = new Node(100);\n" +
                "        System.out.println(\"MULTI_CLASS_WORKING: \" + node.data);\n" +
                "    }\n" +
                "}";

        RunInterviewCodeRequest req = new RunInterviewCodeRequest("Java", originalCode, "");

        OnlineCompilerResponse mockResponse = new OnlineCompilerResponse();
        mockResponse.setStatus("success");
        mockResponse.setOutput("MULTI_CLASS_WORKING: 100\n");
        when(onlineCompilerClient.execute(any(OnlineCompilerRequest.class))).thenReturn(mockResponse);

        RunInterviewCodeResponse result = interviewService.runCode("INT-TEST1234", req);

        ArgumentCaptor<OnlineCompilerRequest> captor = ArgumentCaptor.forClass(OnlineCompilerRequest.class);
        verify(onlineCompilerClient).execute(captor.capture());
        String sentCode = captor.getValue().getCode();

        // Verify Main appears before Node in the payload sent to compiler
        int mainPos = sentCode.indexOf("public class Main");
        int nodePos = sentCode.indexOf("class Node");
        assertTrue(mainPos >= 0, "public class Main must be present");
        assertTrue(nodePos >= 0, "class Node must be present");
        assertTrue(mainPos < nodePos, "public class Main must appear before class Node");

        // Verify original request object code was not mutated
        assertEquals(originalCode, req.getCode());
        assertEquals("MULTI_CLASS_WORKING: 100\n", result.getOutput());
    }

    @Test
    void normalizeJava_MainAlreadyFirst_Unchanged() {
        String code =
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(1);\n" +
                "    }\n" +
                "}\n" +
                "\n" +
                "class Node {\n" +
                "    int x;\n" +
                "}";

        String normalized = InterviewService.normalizeJavaExecutionSource(code);
        assertEquals(code, normalized);
    }

    @Test
    void normalizeJava_SingleClass_Unchanged() {
        String code =
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(\"HELLO\");\n" +
                "    }\n" +
                "}";

        String normalized = InterviewService.normalizeJavaExecutionSource(code);
        assertEquals(code, normalized);
    }

    @Test
    void normalizeJava_MultipleHelperClasses_MainMovesFirstWhileHelpersIntact() {
        String code =
                "class Alpha {\n" +
                "    int a = 1;\n" +
                "}\n" +
                "\n" +
                "class Beta {\n" +
                "    int b = 2;\n" +
                "}\n" +
                "\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(new Alpha().a + new Beta().b + new Gamma().c);\n" +
                "    }\n" +
                "}\n" +
                "\n" +
                "class Gamma {\n" +
                "    int c = 3;\n" +
                "}";

        String normalized = InterviewService.normalizeJavaExecutionSource(code);
        int mainIdx = normalized.indexOf("public class Main");
        int alphaIdx = normalized.indexOf("class Alpha");
        int betaIdx = normalized.indexOf("class Beta");
        int gammaIdx = normalized.indexOf("class Gamma");

        assertTrue(mainIdx < alphaIdx, "Main should be before Alpha");
        assertTrue(alphaIdx < betaIdx, "Alpha should remain before Beta");
        assertTrue(betaIdx < gammaIdx, "Beta should remain before Gamma");
        assertTrue(normalized.contains("int a = 1;"));
        assertTrue(normalized.contains("int b = 2;"));
        assertTrue(normalized.contains("int c = 3;"));
    }

    @Test
    void normalizeJava_BracesInsideCommentsAndStrings_DoesNotSplitIncorrectly() {
        String code =
                "// Class Node with { fake brace and } closing brace\n" +
                "/* Multi-line comment\n" +
                "   with { { { and } } }\n" +
                "*/\n" +
                "class Node {\n" +
                "    String braces = \"{ nested } {{ }}\";\n" +
                "    char open = '{';\n" +
                "    char close = '}';\n" +
                "    String textBlock = \"\"\"\n" +
                "        { inside block }\n" +
                "        \"\"\";\n" +
                "}\n" +
                "\n" +
                "// Main class\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(\"done\");\n" +
                "    }\n" +
                "}";

        String normalized = InterviewService.normalizeJavaExecutionSource(code);
        int mainIdx = normalized.indexOf("public class Main");
        int nodeIdx = normalized.indexOf("class Node");

        assertTrue(mainIdx >= 0);
        assertTrue(nodeIdx >= 0);
        assertTrue(mainIdx < nodeIdx, "Main should be moved before Node despite braces in strings/comments");
        assertTrue(normalized.contains("String braces = \"{ nested } {{ }}\";"));
        assertTrue(normalized.contains("char open = '{';"));
        assertTrue(normalized.contains("char close = '}';"));
    }

    @Test
    void normalizeJava_NestedClasses_NotTreatedAsSeparateTopLevelClasses() {
        String code =
                "class Helper {\n" +
                "    static class NestedInHelper {\n" +
                "        int val = 10;\n" +
                "    }\n" +
                "}\n" +
                "\n" +
                "public class Main {\n" +
                "    static class NestedInMain {\n" +
                "        int score = 20;\n" +
                "    }\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(\"OK\");\n" +
                "    }\n" +
                "}";

        String normalized = InterviewService.normalizeJavaExecutionSource(code);
        int mainIdx = normalized.indexOf("public class Main");
        int helperIdx = normalized.indexOf("class Helper");

        assertTrue(mainIdx < helperIdx, "Main moved before Helper");
        int nestedMainIdx = normalized.indexOf("static class NestedInMain");
        int nestedHelperIdx = normalized.indexOf("static class NestedInHelper");

        assertTrue(nestedMainIdx > mainIdx && nestedMainIdx < helperIdx, "NestedInMain must stay inside Main");
        assertTrue(nestedHelperIdx > helperIdx, "NestedInHelper must stay inside Helper");
    }

    @Test
    void normalizeJava_PackageAndImports_RemainAtTopBeforeReorderedClasses() {
        String code =
                "package com.interview.test;\n" +
                "\n" +
                "import java.util.List;\n" +
                "import java.util.ArrayList;\n" +
                "\n" +
                "class Node {\n" +
                "    int x;\n" +
                "}\n" +
                "\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        List<Node> list = new ArrayList<>();\n" +
                "    }\n" +
                "}";

        String normalized = InterviewService.normalizeJavaExecutionSource(code);

        int pkgIdx = normalized.indexOf("package com.interview.test;");
        int importIdx1 = normalized.indexOf("import java.util.List;");
        int importIdx2 = normalized.indexOf("import java.util.ArrayList;");
        int mainIdx = normalized.indexOf("public class Main");
        int nodeIdx = normalized.indexOf("class Node");

        assertEquals(0, pkgIdx, "Package must be at the very top");
        assertTrue(pkgIdx < importIdx1);
        assertTrue(importIdx1 < importIdx2);
        assertTrue(importIdx2 < mainIdx, "Imports must precede Main");
        assertTrue(mainIdx < nodeIdx, "Main must precede Node");
    }
}

