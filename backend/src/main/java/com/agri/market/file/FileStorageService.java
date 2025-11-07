package com.agri.market.file;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 저장소 서비스 (호환성 래퍼)
 * StorageService 구현체(LocalStorageService 또는 S3StorageService)를 주입받아 사용
 */
@Service
public class FileStorageService {

    private final StorageService storageService;

    public FileStorageService(StorageService storageService) {
        this.storageService = storageService;
    }

    /**
     * 파일 저장
     * @param file 저장할 파일
     * @return 파일명 또는 S3 키
     */
    public String storeFile(MultipartFile file) {
        return storageService.storeFile(file);
    }

    /**
     * 파일 URL 반환
     * @param fileName 파일명 또는 S3 키
     * @return 파일 접근 URL
     */
    public String getFileUrl(String fileName) {
        return storageService.getFileUrl(fileName);
    }

    /**
     * 파일 삭제
     * @param fileName 파일명 또는 S3 키
     */
    public void deleteFile(String fileName) {
        storageService.deleteFile(fileName);
    }

    /**
     * 로컬 파일 경로 반환 (LocalStorageService 사용 시에만)
     * S3StorageService 사용 시 예외 발생
     * @deprecated S3 사용 시 호환되지 않음. getFileUrl() 사용 권장
     */
    @Deprecated
    public java.nio.file.Path loadFile(String fileName) {
        if (storageService instanceof LocalStorageService) {
            return ((LocalStorageService) storageService).loadFile(fileName);
        } else {
            throw new UnsupportedOperationException("loadFile()은 로컬 스토리지에서만 지원됩니다. getFileUrl()을 사용하세요.");
        }
    }
}
