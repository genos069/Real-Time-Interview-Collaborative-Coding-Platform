package com.interviewplatform.backend.service;

import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvatarServiceTest {

    @Mock
    private GridFsTemplate gridFsTemplate;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GridFSFile mockGridFSFile;

    @Mock
    private GridFsResource mockGridFsResource;

    private AvatarService avatarService;
    private User testUser;

    // Magic headers
    private static final byte[] VALID_PNG = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D
    };

    private static final byte[] VALID_JPEG = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
    };

    private static final byte[] VALID_GIF = new byte[]{
            'G', 'I', 'F', '8', '9', 'a', 0x01, 0x00, 0x01, 0x00, (byte) 0x80, 0x00
    };

    private static final byte[] FAKE_IMAGE_EXE = new byte[]{
            'M', 'Z', 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    };

    @BeforeEach
    void setUp() {
        avatarService = new AvatarService(gridFsTemplate, userRepository);
        testUser = new User();
        testUser.setId("user123");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole("CANDIDATE");
    }

    @Test
    void uploadAvatar_shouldThrow_whenFileIsEmpty() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.png", "image/png", new byte[0]);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                avatarService.uploadAvatar(testUser, emptyFile)
        );
        assertTrue(ex.getMessage().contains("Please select an image file"));
    }

    @Test
    void uploadAvatar_shouldThrow_whenFileSizeExceeds4MB() {
        byte[] largeData = new byte[(int) (AvatarService.MAX_FILE_SIZE_BYTES + 1)];
        MockMultipartFile largeFile = new MockMultipartFile("file", "test.png", "image/png", largeData);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                avatarService.uploadAvatar(testUser, largeFile)
        );
        assertTrue(ex.getMessage().contains("exceeds the maximum limit of 4 MB"));
    }

    @Test
    void uploadAvatar_shouldThrow_whenFileSignatureIsInvalid() {
        MockMultipartFile fakeFile = new MockMultipartFile("file", "malicious.png", "image/png", FAKE_IMAGE_EXE);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                avatarService.uploadAvatar(testUser, fakeFile)
        );
        assertTrue(ex.getMessage().contains("Unsupported file format"));
    }

    @Test
    void uploadAvatar_shouldThrow_whenFileIsTooSmall() {
        MockMultipartFile smallFile = new MockMultipartFile("file", "small.png", "image/png", new byte[]{1, 2, 3});
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                avatarService.uploadAvatar(testUser, smallFile)
        );
        assertTrue(ex.getMessage().contains("File is too small"));
    }

    @Test
    void uploadAvatar_shouldSucceed_forValidPng() {
        MockMultipartFile pngFile = new MockMultipartFile("file", "avatar.png", "image/png", VALID_PNG);
        ObjectId generatedId = new ObjectId();
        when(gridFsTemplate.store(any(InputStream.class), eq("avatar-user123"), eq("image/png"), any(Document.class)))
                .thenReturn(generatedId);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = avatarService.uploadAvatar(testUser, pngFile);

        assertNotNull(updatedUser.getAvatar());
        assertTrue(updatedUser.getAvatar().startsWith("/api/user/avatar/user123?t="));
        verify(gridFsTemplate).delete(any(Query.class));
        verify(gridFsTemplate).store(any(InputStream.class), eq("avatar-user123"), eq("image/png"), any(Document.class));
        verify(userRepository).save(testUser);
    }

    @Test
    void uploadAvatar_shouldSucceed_forValidJpeg() {
        MockMultipartFile jpgFile = new MockMultipartFile("file", "photo.jpg", "image/jpeg", VALID_JPEG);
        when(gridFsTemplate.store(any(InputStream.class), eq("avatar-user123"), eq("image/jpeg"), any(Document.class)))
                .thenReturn(new ObjectId());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = avatarService.uploadAvatar(testUser, jpgFile);

        assertNotNull(updatedUser.getAvatar());
        assertTrue(updatedUser.getAvatar().startsWith("/api/user/avatar/user123"));
    }

    @Test
    void uploadAvatar_shouldSucceed_forValidGif() {
        MockMultipartFile gifFile = new MockMultipartFile("file", "anim.gif", "image/gif", VALID_GIF);
        when(gridFsTemplate.store(any(InputStream.class), eq("avatar-user123"), eq("image/gif"), any(Document.class)))
                .thenReturn(new ObjectId());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = avatarService.uploadAvatar(testUser, gifFile);

        assertNotNull(updatedUser.getAvatar());
        assertTrue(updatedUser.getAvatar().startsWith("/api/user/avatar/user123"));
    }

    @Test
    void removeAvatar_shouldClearAvatarAndRemoveFromGridFs() {
        testUser.setAvatar("/api/user/avatar/user123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = avatarService.removeAvatar(testUser);

        assertEquals("", updatedUser.getAvatar());
        verify(gridFsTemplate).delete(any(Query.class));
        verify(userRepository).save(testUser);
    }

    @Test
    void getAvatarData_shouldReturnNull_whenNotFound() {
        when(gridFsTemplate.findOne(any(Query.class))).thenReturn(null);
        AvatarService.AvatarData data = avatarService.getAvatarData("nonexistent");
        assertNull(data);
    }

    @Test
    void getAvatarData_shouldReturnResource_whenFound() {
        Document metadata = new Document("contentType", "image/png");
        when(mockGridFSFile.getMetadata()).thenReturn(metadata);
        when(gridFsTemplate.findOne(any(Query.class))).thenReturn(mockGridFSFile);
        when(gridFsTemplate.getResource(mockGridFSFile)).thenReturn(mockGridFsResource);

        AvatarService.AvatarData data = avatarService.getAvatarData("user123");

        assertNotNull(data);
        assertEquals("image/png", data.getContentType());
        assertEquals(mockGridFsResource, data.getResource());
    }
}
