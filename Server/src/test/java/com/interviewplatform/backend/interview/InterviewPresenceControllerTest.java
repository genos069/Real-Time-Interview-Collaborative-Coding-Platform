package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.websocket.InterviewPresenceController;
import com.interviewplatform.backend.interview.websocket.PresenceMessage;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewPresenceControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private Authentication authentication;

    private InterviewPresenceController presenceController;

    private final String roomId = "room-presence-101";
    private final String candidateId = "cand-id-1";
    private final String interviewerId = "int-id-1";
    private final String observerId = "obs-id-1";

    private User candidateUser;
    private User interviewerUser;
    private User observerUser;
    private Interview activeInterview;

    @BeforeEach
    void setUp() {
        presenceController = new InterviewPresenceController(userService, interviewRepository);

        candidateUser = new User();
        candidateUser.setId(candidateId);
        candidateUser.setName("Rahul Kumar");
        candidateUser.setEmail("rahul@example.com");
        candidateUser.setRole("candidate");

        interviewerUser = new User();
        interviewerUser.setId(interviewerId);
        interviewerUser.setName("Dr. Alice Smith");
        interviewerUser.setEmail("alice@example.com");
        interviewerUser.setRole("interviewer");

        observerUser = new User();
        observerUser.setId(observerId);
        observerUser.setName("Mark Spencer");
        observerUser.setEmail("mark@example.com");
        observerUser.setRole("observer");

        activeInterview = new Interview();
        activeInterview.setRoomId(roomId);
        activeInterview.setStatus("ACTIVE");
        activeInterview.setCandidateId(candidateId);
        activeInterview.setInterviewerId(interviewerId);
        activeInterview.setObserverId(observerId);
    }

    @Test
    void testCandidateJoinPresence() {
        when(authentication.getName()).thenReturn("rahul@example.com");
        when(userService.getUserByEmail("rahul@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        PresenceMessage response = presenceController.joinInterview(roomId, authentication);

        assertNotNull(response);
        assertEquals(roomId, response.getRoomId());
        assertEquals(candidateId, response.getUserId());
        assertEquals("Rahul Kumar", response.getName());
        assertEquals("candidate", response.getRole());
        assertEquals("JOINED", response.getEvent());
    }

    @Test
    void testInterviewerJoinPresence() {
        when(authentication.getName()).thenReturn("alice@example.com");
        when(userService.getUserByEmail("alice@example.com")).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        PresenceMessage response = presenceController.joinInterview(roomId, authentication);

        assertNotNull(response);
        assertEquals(roomId, response.getRoomId());
        assertEquals(interviewerId, response.getUserId());
        assertEquals("Dr. Alice Smith", response.getName());
        assertEquals("interviewer", response.getRole());
        assertEquals("JOINED", response.getEvent());
    }

    @Test
    void testObserverJoinPresence() {
        when(authentication.getName()).thenReturn("mark@example.com");
        when(userService.getUserByEmail("mark@example.com")).thenReturn(observerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        PresenceMessage response = presenceController.joinInterview(roomId, authentication);

        assertNotNull(response);
        assertEquals(roomId, response.getRoomId());
        assertEquals(observerId, response.getUserId());
        assertEquals("Mark Spencer", response.getName());
        assertEquals("observer", response.getRole());
        assertEquals("JOINED", response.getEvent());
    }

    @Test
    void testCandidateLeavePresence() {
        when(authentication.getName()).thenReturn("rahul@example.com");
        when(userService.getUserByEmail("rahul@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        PresenceMessage response = presenceController.leaveInterview(roomId, authentication);

        assertNotNull(response);
        assertEquals(roomId, response.getRoomId());
        assertEquals(candidateId, response.getUserId());
        assertEquals("Rahul Kumar", response.getName());
        assertEquals("candidate", response.getRole());
        assertEquals("LEFT", response.getEvent());
    }

    @Test
    void testUnauthorizedUserJoinRejected() {
        User unauth = new User();
        unauth.setId("stranger-id");
        unauth.setEmail("stranger@example.com");
        unauth.setRole("candidate");

        when(authentication.getName()).thenReturn("stranger@example.com");
        when(userService.getUserByEmail("stranger@example.com")).thenReturn(unauth);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        assertThrows(RuntimeException.class, () ->
                presenceController.joinInterview(roomId, authentication)
        );
    }
}
