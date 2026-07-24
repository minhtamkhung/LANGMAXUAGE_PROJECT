package com.dmt.toeicapp.typing.service.impl;

import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.typing.dto.*;
import com.dmt.toeicapp.typing.entity.TypingSession;
import com.dmt.toeicapp.typing.repository.TypingSessionRepository;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TypingServiceImplTest {

    @Mock
    private TypingSessionRepository typingSessionRepository;

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
    private TypingServiceImpl typingService;

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
    public void testSubmit_withTranslation() {
        // Arrange
        Long sessionId = 100L;
        Long flashcardId = 1L;

        Topic mockTopic = Topic.builder().id(10L).name("Mock Topic").build();
        TypingSession mockSession = TypingSession.builder()
                .id(sessionId)
                .user(mockUser)
                .topic(mockTopic)
                .totalCards(1)
                .startedAt(null)
                .build();

        Flashcard mockCard = Flashcard.builder()
                .id(flashcardId)
                .word("apple")
                .definition("A round fruit")
                .build();

        when(typingSessionRepository.findByIdAndUserId(sessionId, 1L))
                .thenReturn(Optional.of(mockSession));
        when(flashcardRepository.findAllById(List.of(flashcardId)))
                .thenReturn(List.of(mockCard));
        when(typingSessionRepository.save(any(TypingSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act: User typed "apple"
        TypingSubmitRequest request = new TypingSubmitRequest(
                sessionId,
                30,
                List.of(new TypingSubmitRequest.AnswerItem(flashcardId, "apple"))
        );

        TypingSubmitResponse response = typingService.submit(request, "vi");

        // Assert: Accuracy should be 100.00 since user typed "apple"
        System.out.println("Accuracy with current implementation: " + response.accuracy());
        System.out.println("Details correct flag: " + response.details().get(0).correct());
        assertEquals(BigDecimal.valueOf(100.00).setScale(2), response.accuracy());
        assertTrue(response.details().get(0).correct());
    }
}
