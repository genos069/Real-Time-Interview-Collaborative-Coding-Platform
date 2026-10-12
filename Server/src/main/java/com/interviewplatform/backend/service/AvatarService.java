package com.interviewplatform.backend.service;

import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

@Service
public class AvatarService {

    private static final Logger log = LoggerFactory.getLogger(AvatarService.class);

    public static final long MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

    private final GridFsTemplate gridFsTemplate;
    private final UserRepository userRepository;

    public AvatarService(GridFsTemplate gridFsTemplate, UserRepository userRepository) {
        this.gridFsTemplate = gridFsTemplate;
        this.userRepository = userRepository;
    }

    /**
     * Inspects magic numbers / binary header to ensure the file is truly JPEG, PNG, or GIF.
     */
    public String detectAndValidateImageType(InputStream inputStream, String originalFilename) throws IOException {
        byte[] header = new byte[12];
        int bytesRead = inputStream.read(header, 0, header.length);
        if (bytesRead < 8) {
            throw new IllegalArgumentException("File is too small to be a valid image.");
        }

        // JPEG magic number: FF D8 FF
        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }

        // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
        if ((header[0] & 0xFF) == 0x89 &&
            (header[1] & 0xFF) == 0x50 &&
            (header[2] & 0xFF) == 0x4E &&
            (header[3] & 0xFF) == 0x47 &&
            (header[4] & 0xFF) == 0x0D &&
            (header[5] & 0xFF) == 0x0A &&
            (header[6] & 0xFF) == 0x1A &&
            (header[7] & 0xFF) == 0x0A) {
            return "image/png";
        }

        // GIF magic number: GIF87a or GIF89a
        if (header[0] == 'G' && header[1] == 'I' && header[2] == 'F' &&
            header[3] == '8' && (header[4] == '7' || header[4] == '9') && header[5] == 'a') {
            return "image/gif";
        }

        throw new IllegalArgumentException("Unsupported file format. Only JPG, PNG, and GIF images are allowed.");
    }

    /**
     * Uploads and persists avatar for the authenticated user.
     */
    public User uploadAvatar(User user, MultipartFile file) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Authenticated user is required.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image file to upload.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Image size exceeds the maximum limit of 4 MB.");
        }

        String contentType;
        try (InputStream is = new BufferedInputStream(file.getInputStream())) {
            contentType = detectAndValidateImageType(is, file.getOriginalFilename());
        } catch (IOException e) {
            log.error("Failed to read file for avatar upload: {}", e.getMessage());
            throw new RuntimeException("Could not read uploaded file.");
        }

        // Remove any existing avatar files stored for this user in GridFS
        deleteUserAvatarFromGridFs(user.getId());

        // Store new image in GridFS with metadata
        Document metadata = new Document();
        metadata.put("userId", user.getId());
        metadata.put("contentType", contentType);
        metadata.put("originalFilename", file.getOriginalFilename());
        metadata.put("uploadedAt", System.currentTimeMillis());

        try (InputStream uploadStream = file.getInputStream()) {
            ObjectId objectId = gridFsTemplate.store(
                    uploadStream,
                    "avatar-" + user.getId(),
                    contentType,
                    metadata
            );
            log.info("Stored avatar for user {} with GridFS ObjectId {}", user.getId(), objectId);
        } catch (IOException e) {
            log.error("Failed to store avatar in GridFS: {}", e.getMessage());
            throw new RuntimeException("Failed to store image in database.");
        }

        // Update user avatar URL with cache buster
        String avatarUrl = "/api/user/avatar/" + user.getId() + "?t=" + System.currentTimeMillis();
        user.setAvatar(avatarUrl);
        return userRepository.save(user);
    }

    /**
     * Removes the avatar for the authenticated user.
     */
    public User removeAvatar(User user) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Authenticated user is required.");
        }

        deleteUserAvatarFromGridFs(user.getId());

        user.setAvatar("");
        return userRepository.save(user);
    }

    /**
     * Retrieves the avatar resource from GridFS for a user.
     */
    public AvatarData getAvatarData(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }

        GridFSFile gridFSFile = gridFsTemplate.findOne(
                Query.query(Criteria.where("metadata.userId").is(userId))
        );

        if (gridFSFile == null) {
            return null;
        }

        GridFsResource resource = gridFsTemplate.getResource(gridFSFile);
        String contentType = "image/jpeg";
        if (gridFSFile.getMetadata() != null && gridFSFile.getMetadata().containsKey("contentType")) {
            contentType = gridFSFile.getMetadata().getString("contentType");
        }

        return new AvatarData(resource, contentType);
    }

    private void deleteUserAvatarFromGridFs(String userId) {
        try {
            gridFsTemplate.delete(
                    Query.query(Criteria.where("metadata.userId").is(userId))
            );
        } catch (Exception e) {
            log.warn("Non-fatal: Error deleting previous avatar from GridFS for user {}: {}", userId, e.getMessage());
        }
    }

    public static class AvatarData {
        private final Resource resource;
        private final String contentType;

        public AvatarData(Resource resource, String contentType) {
            this.resource = resource;
            this.contentType = contentType;
        }

        public Resource getResource() {
            return resource;
        }

        public String getContentType() {
            return contentType;
        }
    }
}
