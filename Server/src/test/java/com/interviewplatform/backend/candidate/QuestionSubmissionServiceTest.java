package com.interviewplatform.backend.candidate;

import com.interviewplatform.backend.candidate.service.QuestionSubmissionService;
import com.interviewplatform.backend.model.QuestionSubmission;
import com.interviewplatform.backend.model.SubmissionStatus;
import com.interviewplatform.backend.repository.QuestionSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionSubmissionServiceTest {

    @Mock
    private QuestionSubmissionRepository questionSubmissionRepository;

    private QuestionSubmissionService questionSubmissionService;

    @BeforeEach
    void setUp() {
        questionSubmissionService = new QuestionSubmissionService(questionSubmissionRepository);
    }

    @Test
    void getSolvedQuestionIds_WithSolvedSubmissions_ReturnsSetOfQuestionIds() {
        QuestionSubmission s1 = new QuestionSubmission();
        s1.setUserId("user-1");
        s1.setQuestionId("q-101");
        s1.setStatus(SubmissionStatus.SOLVED);

        QuestionSubmission s2 = new QuestionSubmission();
        s2.setUserId("user-1");
        s2.setQuestionId("q-102");
        s2.setStatus(SubmissionStatus.SOLVED);

        when(questionSubmissionRepository.findByUserIdAndStatus("user-1", SubmissionStatus.SOLVED))
                .thenReturn(List.of(s1, s2));

        Set<String> result = questionSubmissionService.getSolvedQuestionIds("user-1");

        assertEquals(2, result.size());
        assertTrue(result.contains("q-101"));
        assertTrue(result.contains("q-102"));
        verify(questionSubmissionRepository, times(1))
                .findByUserIdAndStatus("user-1", SubmissionStatus.SOLVED);
    }

    @Test
    void getSolvedQuestionIds_WithNoSubmissions_ReturnsEmptySet() {
        when(questionSubmissionRepository.findByUserIdAndStatus("user-2", SubmissionStatus.SOLVED))
                .thenReturn(Collections.emptyList());

        Set<String> result = questionSubmissionService.getSolvedQuestionIds("user-2");

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(questionSubmissionRepository, times(1))
                .findByUserIdAndStatus("user-2", SubmissionStatus.SOLVED);
    }

    @Test
    void getSolvedQuestionIds_WithNullUserId_ReturnsEmptySet() {
        Set<String> result = questionSubmissionService.getSolvedQuestionIds(null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(questionSubmissionRepository, never())
                .findByUserIdAndStatus(anyString(), any());
    }
}
