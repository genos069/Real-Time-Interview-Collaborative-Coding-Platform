package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.exception.ErrorResponse;
import com.interviewplatform.backend.exception.GlobalExceptionHandler;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.service.InterviewService;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewCodeSnapshotTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient onlineCompilerClient;

    private InterviewService interviewService;
    private GlobalExceptionHandler globalExceptionHandler;

    @BeforeEach
    void setUp() {
        interviewService = new InterviewService(interviewRepository, userRepository, userService, onlineCompilerClient);
        globalExceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void getCodeSnapshot_UnauthorizedUser_ThrowsForbidden() {
        User unauthorizedUser = new User();
        unauthorizedUser.setId("unauthorized-user-999");
        unauthorizedUser.setRole("candidate");
        when(userService.getLoggedInUser()).thenReturn(unauthorizedUser);

        Interview interview = new Interview();
        interview.setRoomId("INT-12345678");
        interview.setCandidateId("candidate-user-111");
        interview.setInterviewerId("interviewer-user-222");
        when(interviewRepository.findByRoomId("INT-12345678")).thenReturn(Optional.of(interview));

        ApiException exception = assertThrows(ApiException.class, () ->
                interviewService.getCodeSnapshot("INT-12345678")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("You are not authorized to access this interview room", exception.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(exception);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("You are not authorized to access this interview room", response.getBody().getMessage());
    }

    @Test
    void getCodeSnapshot_RoomNotFound_ThrowsNotFound() {
        User user = new User();
        user.setId("user-1");
        user.setRole("candidate");
        when(userService.getLoggedInUser()).thenReturn(user);

        when(interviewRepository.findByRoomId("NON-EXISTENT")).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class, () ->
                interviewService.getCodeSnapshot("NON-EXISTENT")
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("Interview room not found", exception.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(exception);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Interview room not found", response.getBody().getMessage());
    }

    @Test
    void getCodeSnapshot_AuthorizedCandidate_ReturnsSnapshot() {
        User candidate = new User();
        candidate.setId("candidate-1");
        candidate.setRole("candidate");
        when(userService.getLoggedInUser()).thenReturn(candidate);

        Interview interview = new Interview();
        interview.setRoomId("INT-12345678");
        interview.setCandidateId("candidate-1");
        interview.setInterviewerId("interviewer-1");
        interview.setCurrentCode("console.log('hello world');");
        interview.setLanguage("javascript");
        when(interviewRepository.findByRoomId("INT-12345678")).thenReturn(Optional.of(interview));

        Map<String, String> snapshot = interviewService.getCodeSnapshot("INT-12345678");

        assertEquals("INT-12345678", snapshot.get("roomId"));
        assertEquals("console.log('hello world');", snapshot.get("currentCode"));
        assertEquals("javascript", snapshot.get("language"));
    }

    @Test
    void updateCodeSnapshot_LanguageOnly_DoesNotAssociatePreviousCodeWithNewLanguage() {
        Interview interview = new Interview();
        interview.setRoomId("INT-12345678");
        interview.setCurrentCode("public class Main {}");
        interview.setLanguage("Java");
        interview.getCodes().put("Java", "public class Main {}");
        when(interviewRepository.findByRoomId("INT-12345678")).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Interview result = interviewService.updateCodeSnapshot("INT-12345678", null, "Python");

        assertNotNull(result);
        assertEquals("Python", result.getLanguage());
        // Assert that currentCode does NOT retain the Java code when language is Python
        assertNotEquals("public class Main {}", result.getCurrentCode());
        assertEquals(InterviewService.DEFAULT_PYTHON_TEMPLATE, result.getCurrentCode());
        // Assert that the Java code is still preserved in the codes map
        assertEquals("public class Main {}", result.getCodes().get("Java"));
    }

    @Test
    void updateCodeSnapshot_LanguageOnly_RestoresExistingCodeForThatLanguage() {
        Interview interview = new Interview();
        interview.setRoomId("INT-12345678");
        interview.setCurrentCode("def hello(): pass");
        interview.setLanguage("Python");
        interview.getCodes().put("Java", "public class Main { // distinct java }");
        interview.getCodes().put("Python", "def hello(): pass");
        when(interviewRepository.findByRoomId("INT-12345678")).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Switch to Java with code: null
        Interview result = interviewService.updateCodeSnapshot("INT-12345678", null, "Java");

        assertNotNull(result);
        assertEquals("Java", result.getLanguage());
        assertEquals("public class Main { // distinct java }", result.getCurrentCode());
        assertEquals("def hello(): pass", result.getCodes().get("Python"));
    }

    @Test
    void updateCodeSnapshot_WithCodeAndLanguage_UpdatesBoth() {
        Interview interview = new Interview();
        interview.setRoomId("INT-12345678");
        interview.setCurrentCode("public class Main {}");
        interview.setLanguage("Java");
        when(interviewRepository.findByRoomId("INT-12345678")).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Interview result = interviewService.updateCodeSnapshot("INT-12345678", "def hello(): pass", "Python");

        assertNotNull(result);
        assertEquals("def hello(): pass", result.getCurrentCode());
        assertEquals("Python", result.getLanguage());
        assertEquals("def hello(): pass", result.getCodes().get("Python"));
    }
}
