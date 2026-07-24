package com.dmt.toeicapp.matching.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.matching.dto.*;
import com.dmt.toeicapp.matching.entity.MatchingSession;
import com.dmt.toeicapp.matching.repository.MatchingSessionRepository;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MatchingServiceImplTest {

    @Mock
    private MatchingSessionRepository matchingSessionRepository;

    @Mock
    private FlashcardRepository flashcardRepository;

    @Mock
    private FlashcardTranslationRepository translationRepository;

    @Mock
    private TopicRepository topicRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.dmt.toeicapp.progress.service.ProgressService progressService;

    @InjectMocks
    private MatchingServiceImpl matchingService;

    private User mockUser;
    private SecurityContext securityContext;

    @BeforeEach
    public void setUp() {
        mockUser = User.builder().id(1L).username("testuser").role(User.Role.USER).build();
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(mockUser);

        securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testStart_success() {
        Topic mockTopic = Topic.builder().id(10L).name("Mock Topic").build();

        Flashcard f1 = Flashcard.builder().id(101L).word("Word 1").definition("Def 1").topic(mockTopic).build();
        Flashcard f2 = Flashcard.builder().id(102L).word("Word 2").definition("Def 2").topic(mockTopic).build();

        when(topicRepository.findById(10L)).thenReturn(Optional.of(mockTopic));
        when(flashcardRepository.countByTopicId(10L, 1L)).thenReturn(2L);
        when(flashcardRepository.findByTopicId(eq(10L), eq(1L), any(PageRequest.of(0, 2).getClass())))
                .thenReturn(new PageImpl<>(List.of(f1, f2)));
        when(translationRepository.findByFlashcardIdsAndLocale(anyList(), eq("en")))
                .thenReturn(List.of());
        when(matchingSessionRepository.save(any(MatchingSession.class)))
                .thenAnswer(invocation -> {
                    MatchingSession saved = invocation.getArgument(0);
                    saved.setId(999L);
                    return saved;
                });

        MatchingStartRequest request = new MatchingStartRequest(10L, 2);
        MatchingStartResponse response = matchingService.start(request, "en");

        assertNotNull(response);
        assertEquals(999L, response.sessionId());
        assertEquals(10L, response.topicId());
        assertEquals("Mock Topic", response.topicName());
        assertEquals(2, response.words().size());
        assertEquals(2, response.definitions().size());
    }

    @Test
    public void testSubmit_success() {
        Topic mockTopic = Topic.builder().id(10L).name("Mock Topic").build();
        MatchingSession session = MatchingSession.builder()
                .id(999L)
                .user(mockUser)
                .topic(mockTopic)
                .totalPairs(4)
                .startedAt(OffsetDateTime.now())
                .build();

        Flashcard f1 = Flashcard.builder().id(101L).word("Word 1").definition("Def 1").topic(mockTopic).build();
        Flashcard f2 = Flashcard.builder().id(102L).word("Word 2").definition("Def 2").topic(mockTopic).build();
        Flashcard f3 = Flashcard.builder().id(103L).word("Word 3").definition("Def 3").topic(mockTopic).build();
        Flashcard f4 = Flashcard.builder().id(104L).word("Word 4").definition("Def 4").topic(mockTopic).build();

        when(matchingSessionRepository.findByIdAndUserId(999L, 1L))
                .thenReturn(Optional.of(session));
        when(flashcardRepository.findAllById(List.of(101L, 102L, 103L, 104L)))
                .thenReturn(List.of(f1, f2, f3, f4));
        when(matchingSessionRepository.save(any(MatchingSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Nộp kết quả: 2 cặp đúng (101-101, 102-102), 2 cặp sai (103-104, 104-103)
        MatchingSubmitRequest request = new MatchingSubmitRequest(
                999L,
                45,
                List.of(
                        new MatchingSubmitRequest.MatchPair(101L, 101L), // đúng
                        new MatchingSubmitRequest.MatchPair(102L, 102L), // đúng
                        new MatchingSubmitRequest.MatchPair(103L, 104L), // sai
                        new MatchingSubmitRequest.MatchPair(104L, 103L)  // sai
                )
        );

        MatchingSubmitResponse response = matchingService.submit(request, "en");

        assertNotNull(response);
        assertEquals(999L, response.sessionId());
        assertEquals(4, response.totalPairs());
        assertEquals(2, response.correctPairs());
        assertEquals(BigDecimal.valueOf(50.00).setScale(2), response.accuracy());
        assertEquals(45, response.durationSeconds());
    }

    @Test
    public void testSubmit_duplicateElements_throwsException() {
        MatchingSession session = MatchingSession.builder()
                .id(999L)
                .user(mockUser)
                .totalPairs(2)
                .startedAt(OffsetDateTime.now())
                .build();

        when(matchingSessionRepository.findByIdAndUserId(999L, 1L))
                .thenReturn(Optional.of(session));

        // Submit trùng lặp wordId (101)
        MatchingSubmitRequest request = new MatchingSubmitRequest(
                999L,
                45,
                List.of(
                        new MatchingSubmitRequest.MatchPair(101L, 101L),
                        new MatchingSubmitRequest.MatchPair(101L, 102L)
                )
        );

        AppException ex = assertThrows(AppException.class, () -> matchingService.submit(request, "en"));
        assertEquals("MATCHING_DUPLICATE_ELEMENTS", ex.getCode());
    }
}
