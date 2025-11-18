package com.agri.market.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 로컬 파일 시스템 기반 스토리지 서비스
 */
@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    // 허용된 파일 확장자 (화이트리스트)
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", // 이미지
            ".mp4", ".webm", ".ogg", // 동영상
            ".pdf", ".doc", ".docx", ".xls", ".xlsx" // 문서
    );

    // 최대 파일 크기 (50MB - 동영상 지원)
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    private final Path fileStorageLocation;

    @Value("${server.port:8081}")
    private String serverPort;

    public LocalStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir)
                .toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("파일 저장 디렉토리를 생성할 수 없습니다.", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        // 빈 파일 체크
        if (file.isEmpty()) {
            throw new RuntimeException("빈 파일은 저장할 수 없습니다.");
        }

        // 파일 크기 체크
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.");
        }

        // 원본 파일명 정리
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Path Traversal 공격 방지 (여러 단계 검증)
            if (originalFileName.contains("..") || originalFileName.contains("/") || originalFileName.contains("\\")) {
                throw new RuntimeException("파일명에 부적합한 문자가 포함되어 있습니다: " + originalFileName);
            }

            // 파일 확장자 추출 및 검증
            String fileExtension = "";
            int dotIndex = originalFileName.lastIndexOf('.');
            if (dotIndex > 0) {
                fileExtension = originalFileName.substring(dotIndex).toLowerCase();
            }

            // 확장자 화이트리스트 검증
            if (!ALLOWED_EXTENSIONS.contains(fileExtension)) {
                throw new RuntimeException("허용되지 않는 파일 형식입니다: " + fileExtension +
                        ". 허용된 형식: " + String.join(", ", ALLOWED_EXTENSIONS));
            }

            // Content-Type 검증 (추가 보안)
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/") &&
                                       !contentType.startsWith("video/") &&
                                       !contentType.startsWith("application/"))) {
                throw new RuntimeException("허용되지 않는 파일 타입입니다: " + contentType);
            }

            // UUID를 사용하여 고유한 파일명 생성
            String fileName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString() + fileExtension;

            // 파일 저장 경로 정규화 및 검증
            Path targetLocation = this.fileStorageLocation.resolve(fileName).normalize();

            // 저장 경로가 업로드 디렉토리 내부인지 확인 (Path Traversal 방지)
            if (!targetLocation.startsWith(this.fileStorageLocation)) {
                throw new RuntimeException("파일을 저장할 수 없는 경로입니다.");
            }

            // 파일 저장
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName;

        } catch (IOException ex) {
            throw new RuntimeException("파일 저장에 실패했습니다: " + originalFileName, ex);
        }
    }

    @Override
    public String getFileUrl(String fileName) {
        // 로컬 파일은 API 엔드포인트를 통해 제공
        return "/api/files/" + fileName;
    }

    @Override
    public void deleteFile(String fileName) {
        try {
            // 파일명 검증
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                throw new RuntimeException("부적합한 파일명입니다: " + fileName);
            }

            Path filePath = fileStorageLocation.resolve(fileName).normalize();

            // 파일 경로가 업로드 디렉토리 내부인지 확인
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new RuntimeException("파일에 접근할 수 없습니다.");
            }

            // 파일 삭제
            Files.deleteIfExists(filePath);

        } catch (IOException ex) {
            throw new RuntimeException("파일 삭제에 실패했습니다: " + fileName, ex);
        }
    }

    public Path loadFile(String fileName) {
        // 파일명 검증
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new RuntimeException("부적합한 파일명입니다: " + fileName);
        }

        Path filePath = fileStorageLocation.resolve(fileName).normalize();

        // 파일 경로가 업로드 디렉토리 내부인지 확인
        if (!filePath.startsWith(this.fileStorageLocation)) {
            throw new RuntimeException("파일에 접근할 수 없습니다.");
        }

        // 파일 존재 여부 확인
        if (!Files.exists(filePath)) {
            throw new RuntimeException("파일을 찾을 수 없습니다: " + fileName);
        }

        return filePath;
    }
}
