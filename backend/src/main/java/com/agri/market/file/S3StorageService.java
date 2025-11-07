package com.agri.market.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * AWS S3 기반 스토리지 서비스
 */
@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    // 허용된 파일 확장자 (화이트리스트)
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", // 이미지
            ".pdf", ".doc", ".docx", ".xls", ".xlsx" // 문서
    );

    // 최대 파일 크기 (10MB)
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    public S3StorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String storeFile(MultipartFile file) {
        // 빈 파일 체크
        if (file.isEmpty()) {
            throw new RuntimeException("빈 파일은 저장할 수 없습니다.");
        }

        // 파일 크기 체크
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.");
        }

        // 원본 파일명 정리
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Path Traversal 공격 방지
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
                                       !contentType.startsWith("application/"))) {
                throw new RuntimeException("허용되지 않는 파일 타입입니다: " + contentType);
            }

            // S3 키 생성 (폴더 구조: uploads/YYYY-MM-DD/filename)
            String s3Key = generateS3Key(fileExtension);

            // S3 업로드
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            return s3Key;

        } catch (S3Exception e) {
            throw new RuntimeException("S3 업로드에 실패했습니다: " + e.awsErrorDetails().errorMessage(), e);
        } catch (IOException e) {
            throw new RuntimeException("파일 읽기에 실패했습니다: " + originalFileName, e);
        }
    }

    @Override
    public String getFileUrl(String s3Key) {
        // S3 공개 URL 반환 (버킷이 공개된 경우)
        // CloudFront 사용 시 CloudFront URL로 변경 필요
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, s3Key);
    }

    @Override
    public void deleteFile(String s3Key) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);

        } catch (S3Exception e) {
            throw new RuntimeException("S3 파일 삭제에 실패했습니다: " + e.awsErrorDetails().errorMessage(), e);
        }
    }

    /**
     * S3 키 생성 (uploads/YYYY-MM-DD/timestamp_uuid.ext)
     */
    private String generateS3Key(String fileExtension) {
        String date = java.time.LocalDate.now().toString(); // YYYY-MM-DD
        String fileName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString() + fileExtension;
        return "uploads/" + date + "/" + fileName;
    }
}
