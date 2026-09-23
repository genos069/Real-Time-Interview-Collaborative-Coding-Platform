package com.interviewplatform.backend.candidate;

import com.interviewplatform.backend.candidate.dto.practice.PracticeQuestionResponse;
import com.interviewplatform.backend.candidate.service.PracticeQuestionService;
import com.interviewplatform.backend.candidate.service.QuestionSubmissionService;
import com.interviewplatform.backend.model.Difficulty;
import com.interviewplatform.backend.model.Question;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.QuestionRepository;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PracticeQuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private UserService userService;

    @Mock
    private QuestionSubmissionService questionSubmissionService;

    private PracticeQuestionService practiceQuestionService;

    private User testUser;

    @BeforeEach
    void setUp() {
        practiceQuestionService = new PracticeQuestionService(
                questionRepository,
                userService,
                questionSubmissionService
        );

        testUser = new User();
        testUser.setId("user-101");
        testUser.setEmail("candidate@test.com");
    }

    @Test
    void getPracticeQuestions_UserWithSolvedQuestions_ReturnsCorrectSolvedStatusAndEliminatesNPlusOne() {
        Question q1 = new Question();
        q1.setId("q-1");
        q1.setTitle("Two Sum");
        q1.setCategory("Arrays");
        q1.setDifficulty(Difficulty.EASY);
        q1.setEstimatedTime(15);

        Question q2 = new Question();
        q2.setId("q-2");
        q2.setTitle("Add Two Numbers");
        q2.setCategory("Linked List");
        q2.setDifficulty(Difficulty.MEDIUM);
        q2.setEstimatedTime(25);

        Question q3 = new Question();
        q3.setId("q-3");
        q3.setTitle("Median of Two Sorted Arrays");
        q3.setCategory("Binary Search");
        q3.setDifficulty(Difficulty.HARD);
        q3.setEstimatedTime(40);

        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findAllSummary()).thenReturn(List.of(q1, q2, q3));
        when(questionSubmissionService.getSolvedQuestionIds("user-101")).thenReturn(Set.of("q-2"));

        List<PracticeQuestionResponse> result = practiceQuestionService.getPracticeQuestions(null);

        assertEquals(3, result.size());
        assertFalse(result.get(0).isDone(), "q-1 should be unsolved");
        assertTrue(result.get(1).isDone(), "q-2 should be solved");
        assertFalse(result.get(2).isDone(), "q-3 should be unsolved");

        // Verify lightweight projection query was performed and full findAll was never called
        verify(questionRepository, times(1)).findAllSummary();
        verify(questionRepository, never()).findAll();

        // Verify single batch query was performed
        verify(questionSubmissionService, times(1)).getSolvedQuestionIds("user-101");

        // Verify per-question isSolved was NEVER called
        verify(questionSubmissionService, never()).isSolved(anyString(), anyString());
    }

    @Test
    void getPracticeQuestions_UserWithNoSolvedQuestions_ReturnsAllUnsolvedAndEliminatesNPlusOne() {
        Question q1 = new Question();
        q1.setId("q-1");
        q1.setTitle("Two Sum");
        q1.setCategory("Arrays");
        q1.setDifficulty(Difficulty.EASY);

        Question q2 = new Question();
        q2.setId("q-2");
        q2.setTitle("Valid Parentheses");
        q2.setCategory("Stack");
        q2.setDifficulty(Difficulty.EASY);

        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findAllSummary()).thenReturn(List.of(q1, q2));
        when(questionSubmissionService.getSolvedQuestionIds("user-101")).thenReturn(Collections.emptySet());

        List<PracticeQuestionResponse> result = practiceQuestionService.getPracticeQuestions("");

        assertEquals(2, result.size());
        assertFalse(result.get(0).isDone(), "q-1 should be unsolved");
        assertFalse(result.get(1).isDone(), "q-2 should be unsolved");

        // Verify lightweight projection query was performed
        verify(questionRepository, times(1)).findAllSummary();
        verify(questionRepository, never()).findAll();

        // Verify single batch query was performed
        verify(questionSubmissionService, times(1)).getSolvedQuestionIds("user-101");

        // Verify per-question isSolved was NEVER called
        verify(questionSubmissionService, never()).isSolved(anyString(), anyString());
    }

    @Test
    void getPracticeQuestions_WithDifficultyFilter_PreservesFiltering() {
        Question qHard = new Question();
        qHard.setId("q-hard-1");
        qHard.setTitle("Trapping Rain Water");
        qHard.setCategory("Two Pointers");
        qHard.setDifficulty(Difficulty.HARD);

        when(userService.getLoggedInUser()).thenReturn(testUser);
        when(questionRepository.findByDifficultySummary(Difficulty.HARD)).thenReturn(List.of(qHard));
        when(questionSubmissionService.getSolvedQuestionIds("user-101")).thenReturn(Set.of("q-hard-1"));

        List<PracticeQuestionResponse> result = practiceQuestionService.getPracticeQuestions("HARD");

        assertEquals(1, result.size());
        assertEquals("q-hard-1", result.get(0).getId());
        assertTrue(result.get(0).isDone());

        verify(questionRepository, times(1)).findByDifficultySummary(Difficulty.HARD);
        verify(questionRepository, never()).findByDifficulty(any());
        verify(questionRepository, never()).findAllSummary();
        verify(questionRepository, never()).findAll();
        verify(questionSubmissionService, times(1)).getSolvedQuestionIds("user-101");
        verify(questionSubmissionService, never()).isSolved(anyString(), anyString());
    }
}
