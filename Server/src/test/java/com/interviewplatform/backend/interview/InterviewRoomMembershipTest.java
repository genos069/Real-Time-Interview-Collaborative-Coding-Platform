package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewRoomMembershipTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private OnlineCompilerClient onlineCompilerClient;

    private InterviewService interviewService;

    private final String roomId = "INT-TEST-ROOM";
    private final String interviewerId = "int-101";
    private final String candidateId = "cand-202";
    private final String observerId = "obs-303";

    private Interview room;

    @BeforeEach
    void setUp() {
        interviewService = new InterviewService(interviewRepository, userRepository, userService, onlineCompilerClient);

        room = new Interview();
        room.setRoomId(roomId);
        room.setStatus("ACTIVE");
        room.setInterviewerId(interviewerId);
        room.setCandidateId(candidateId);
        room.setObserverId(observerId);
    }

    @Test
    void getInterviewByRoomId_AssignedInterviewer_ReturnsRoom() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");

        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(room));
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        Interview result = interviewService.getInterviewByRoomId(roomId);

        assertNotNull(result);
        assertEquals(roomId, result.getRoomId());
        assertEquals(interviewerId, result.getInterviewerId());
    }

    @Test
    void getInterviewByRoomId_AssignedCandidate_ReturnsRoom() {
        User candidate = new User();
        candidate.setId(candidateId);
        candidate.setRole("candidate");

        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(room));
        when(userService.getLoggedInUser()).thenReturn(candidate);

        Interview result = interviewService.getInterviewByRoomId(roomId);

        assertNotNull(result);
        assertEquals(roomId, result.getRoomId());
        assertEquals(candidateId, result.getCandidateId());
    }

    @Test
    void getInterviewByRoomId_AssignedObserver_ReturnsRoom() {
        User observer = new User();
        observer.setId(observerId);
        observer.setRole("observer");

        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(room));
        when(userService.getLoggedInUser()).thenReturn(observer);

        Interview result = interviewService.getInterviewByRoomId(roomId);

        assertNotNull(result);
        assertEquals(roomId, result.getRoomId());
        assertEquals(observerId, result.getObserverId());
    }

    @Test
    void getInterviewByRoomId_UnassignedInterviewer_ThrowsForbidden() {
        User strangerInterviewer = new User();
        strangerInterviewer.setId("stranger-int-999");
        strangerInterviewer.setRole("interviewer");

        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(room));
        when(userService.getLoggedInUser()).thenReturn(strangerInterviewer);

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.getInterviewByRoomId(roomId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertTrue(ex.getMessage().contains("not authorized"));
    }

    @Test
    void getInterviewByRoomId_UnassignedCandidate_ThrowsForbidden() {
        User strangerCandidate = new User();
        strangerCandidate.setId("stranger-cand-888");
        strangerCandidate.setRole("candidate");

        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(room));
        when(userService.getLoggedInUser()).thenReturn(strangerCandidate);

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.getInterviewByRoomId(roomId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertTrue(ex.getMessage().contains("not authorized"));
    }

    @Test
    void getInterviewByRoomId_RoomNotFound_ThrowsNotFound() {
        when(interviewRepository.findByRoomId("NON-EXISTENT")).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.getInterviewByRoomId("NON-EXISTENT")
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }
}
