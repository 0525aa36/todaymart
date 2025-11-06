package com.agri.market.file;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("FileStorageService 단위 테스트")
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(tempDir.toString());
    }

    @Test
    @DisplayName("파일 저장 - 성공 (이미지)")
    void storeFile_Success_Image() {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        // When
        String fileName = fileStorageService.storeFile(file);

        // Then
        assertNotNull(fileName);
        assertTrue(fileName.endsWith(".jpg"));
        Path savedFile = tempDir.resolve(fileName);
        assertTrue(Files.exists(savedFile));
    }

    @Test
    @DisplayName("파일 저장 - 빈 파일 거부")
    void storeFile_EmptyFile_ThrowsException() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.jpg",
                "image/jpeg",
                new byte[0]
        );

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> fileStorageService.storeFile(emptyFile));
        assertTrue(exception.getMessage().contains("빈 파일"));
    }

    @Test
    @DisplayName("파일 저장 - 파일 크기 제한 초과")
    void storeFile_FileTooLarge_ThrowsException() {
        // Given - 11MB 파일 (제한: 10MB)
        byte[] largeContent = new byte[11 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.jpg",
                "image/jpeg",
                largeContent
        );

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> fileStorageService.storeFile(largeFile));
        assertTrue(exception.getMessage().contains("파일 크기가 너무 큽니다"));
    }

    @Test
    @DisplayName("파일 저장 - Path Traversal 공격 차단")
    void storeFile_PathTraversal_ThrowsException() {
        // Given
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file",
                "../../../etc/passwd",
                "image/jpeg",
                "malicious content".getBytes()
        );

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> fileStorageService.storeFile(maliciousFile));
        assertTrue(exception.getMessage().contains("부적합한 문자"));
    }

    @Test
    @DisplayName("파일 저장 - 허용되지 않는 확장자 거부")
    void storeFile_InvalidExtension_ThrowsException() {
        // Given
        MockMultipartFile executableFile = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                "malicious executable".getBytes()
        );

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> fileStorageService.storeFile(executableFile));
        assertTrue(exception.getMessage().contains("허용되지 않는 파일 형식"));
    }

    @Test
    @DisplayName("파일 저장 - 허용되지 않는 Content-Type 거부")
    void storeFile_InvalidContentType_ThrowsException() {
        // Given
        MockMultipartFile scriptFile = new MockMultipartFile(
                "file",
                "script.jpg", // 확장자는 jpg지만 Content-Type이 다름
                "text/javascript",
                "alert('xss')".getBytes()
        );

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> fileStorageService.storeFile(scriptFile));
        assertTrue(exception.getMessage().contains("허용되지 않는 파일 타입"));
    }

    @Test
    @DisplayName("파일 로드 - 성공")
    void loadFile_Success() throws IOException {
        // Given - 먼저 파일 저장
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.png",
                "image/png",
                "test content".getBytes()
        );
        String fileName = fileStorageService.storeFile(file);

        // When
        Path loadedPath = fileStorageService.loadFile(fileName);

        // Then
        assertNotNull(loadedPath);
        assertTrue(Files.exists(loadedPath));
    }

    @Test
    @DisplayName("파일 로드 - 존재하지 않는 파일")
    void loadFile_NotFound_ThrowsException() {
        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> fileStorageService.loadFile("nonexistent.jpg"));
        assertTrue(exception.getMessage().contains("파일을 찾을 수 없습니다"));
    }

    @Test
    @DisplayName("파일 로드 - Path Traversal 공격 차단")
    void loadFile_PathTraversal_ThrowsException() {
        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> fileStorageService.loadFile("../../etc/passwd"));
        assertTrue(exception.getMessage().contains("부적합한 파일명"));
    }

    @Test
    @DisplayName("허용된 모든 이미지 확장자 저장 가능")
    void storeFile_AllAllowedImageExtensions_Success() {
        String[] allowedExtensions = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"};

        for (String ext : allowedExtensions) {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test" + ext,
                    "image/" + ext.substring(1),
                    "test content".getBytes()
            );

            // When
            String fileName = fileStorageService.storeFile(file);

            // Then
            assertNotNull(fileName, "확장자 " + ext + " 저장 실패");
            assertTrue(fileName.endsWith(ext.toLowerCase()));
        }
    }

    @Test
    @DisplayName("허용된 문서 확장자 저장 가능")
    void storeFile_AllowedDocumentExtensions_Success() {
        // Given
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "pdf content".getBytes()
        );

        // When
        String fileName = fileStorageService.storeFile(pdfFile);

        // Then
        assertNotNull(fileName);
        assertTrue(fileName.endsWith(".pdf"));
    }
}
