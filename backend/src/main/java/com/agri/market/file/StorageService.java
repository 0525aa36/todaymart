package com.agri.market.file;

import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 저장소 서비스 인터페이스
 * 로컬 파일 시스템 또는 AWS S3를 지원
 */
public interface StorageService {

    /**
     * 파일을 저장하고 저장된 파일명/키를 반환
     * @param file 저장할 파일
     * @return 저장된 파일명 또는 S3 키
     */
    String storeFile(MultipartFile file);

    /**
     * 파일 접근 URL 반환
     * @param fileName 파일명 또는 S3 키
     * @return 파일 접근 URL (로컬: /api/files/{fileName}, S3: CloudFront/S3 URL)
     */
    String getFileUrl(String fileName);

    /**
     * 파일 삭제
     * @param fileName 파일명 또는 S3 키
     */
    void deleteFile(String fileName);
}
