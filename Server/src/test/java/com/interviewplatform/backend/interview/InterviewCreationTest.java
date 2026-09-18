package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.interview.dto.CreateInterviewRequest;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewCreationTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private OnlineCompilerClient onlineCompilerClient;

    private InterviewService interviewService;

    private User interviewerUser;
    private User candidateUser;

    @BeforeEach
    void setUp() {
        interviewService = new InterviewService(
                interviewRepository,
                userRepository,
                userService,
                onlineCompilerClient
        );

        interviewerUser = new User();
        interviewerUser.setId("intv-999");
        interviewerUser.setName("Sarah Lin");
        interviewerUser.setEmail("sarah.lin@company.com");
        interviewerUser.setRole("interviewer");

        candidateUser = new User();
        candidateUser.setId("cand-888");
        candidateUser.setName("Alex Chen");
        candidateUser.setEmail("alex.chen@example.com");
        candidateUser.setRole("candidate");
    }

    @Test
    void createInterview_ValidCandidateEmail_CreatesAndPersistsInterview() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(userRepository.findByEmailIgnoreCase("alex.chen@example.com")).thenReturn(Optional.of(candidateUser));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setTitle("Senior Full Stack Loop");
        request.setTargetRole("Full Stack Engineer");
        request.setInterviewType("technical");
        request.setCandidateEmail("alex.chen@example.com");
        request.setCandidateNotes("Focus on React and system design");

        Interview created = interviewService.createInterview(request);

        assertNotNull(created);
        assertNotNull(created.getRoomId());
        assertTrue(created.getRoomId().startsWith("INT-"));
        assertEquals("CREATED", created.getStatus());
        assertEquals("Senior Full Stack Loop", created.getTitle());
        assertEquals("Full Stack Engineer", created.getTargetRole());
        assertEquals("technical", created.getInterviewType());
        assertEquals("intv-999", created.getInterviewerId());
        assertEquals("cand-888", created.getCandidateId());
        assertEquals("alex.chen@example.com", created.getCandidateEmail());
        assertEquals("Focus on React and system design", created.getCandidateNotes());
        assertNotNull(created.getCreatedAt());

        ArgumentCaptor<Interview> captor = ArgumentCaptor.forClass(Interview.class);
        verify(interviewRepository).save(captor.capture());
        Interview saved = captor.getValue();
        assertEquals("cand-888", saved.getCandidateId());
        assertEquals("alex.chen@example.com", saved.getCandidateEmail());
    }

    @Test
    void createInterview_CaseInsensitiveEmail_FindsCandidate() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(userRepository.findByEmailIgnoreCase("ALEX.CHEN@EXAMPLE.COM")).thenReturn(Optional.of(candidateUser));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setTitle("Frontend Specialist");
        request.setTargetRole("Frontend Engineer");
        request.setInterviewType("technical");
        request.setCandidateEmail("ALEX.CHEN@EXAMPLE.COM");

        Interview created = interviewService.createInterview(request);

        assertNotNull(created);
        assertEquals("cand-888", created.getCandidateId());
        assertEquals("alex.chen@example.com", created.getCandidateEmail());
    }

    @Test
    void createInterview_UnknownCandidateEmail_ThrowsNotFoundException() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(userRepository.findByEmailIgnoreCase("unknown@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setTitle("Technical Interview");
        request.setTargetRole("Backend Engineer");
        request.setInterviewType("technical");
        request.setCandidateEmail("unknown@example.com");

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.createInterview(request)
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertTrue(ex.getMessage().contains("Candidate not found with email: unknown@example.com"));
        verify(interviewRepository, never()).save(any());
    }

    @Test
    void createInterview_NonCandidateEmail_ThrowsBadRequest() {
        User anotherInterviewer = new User();
        anotherInterviewer.setId("intv-777");
        anotherInterviewer.setEmail("david@company.com");
        anotherInterviewer.setRole("interviewer");

        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(userRepository.findByEmailIgnoreCase("david@company.com")).thenReturn(Optional.of(anotherInterviewer));

        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setTitle("System Design Round");
        request.setTargetRole("Architect");
        request.setInterviewType("system");
        request.setCandidateEmail("david@company.com");

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.createInterview(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("The selected user is not a candidate", ex.getMessage());
        verify(interviewRepository, never()).save(any());
    }

    @Test
    void createInterview_NonInterviewerCaller_ThrowsForbidden() {
        User unauthorizedCandidate = new User();
        unauthorizedCandidate.setId("cand-111");
        unauthorizedCandidate.setRole("candidate");

        when(userService.getLoggedInUser()).thenReturn(unauthorizedCandidate);

        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setTitle("Peer Mock");
        request.setCandidateEmail("alex.chen@example.com");

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.createInterview(request)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("Only interviewers can create interviews", ex.getMessage());
        verify(interviewRepository, never()).save(any());
    }

    @Test
    void createInterview_LegacyCandidateId_StillWorks() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(userRepository.findById("cand-888")).thenReturn(Optional.of(candidateUser));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setTitle("Legacy ID Interview");
        request.setTargetRole("DevOps Engineer");
        request.setInterviewType("technical");
        request.setCandidateId("cand-888");

        Interview created = interviewService.createInterview(request);

        assertNotNull(created);
        assertEquals("cand-888", created.getCandidateId());
        assertEquals("alex.chen@example.com", created.getCandidateEmail());
    }

    @Test
    void createInterview_MissingBothEmailAndId_ThrowsBadRequest() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);

        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setTitle("Incomplete Request");
        request.setTargetRole("Software Engineer");
        request.setCandidateEmail(null);
        request.setCandidateId(null);

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.createInterview(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Candidate email or candidate ID is required", ex.getMessage());
        verify(interviewRepository, never()).save(any());
    }
}
