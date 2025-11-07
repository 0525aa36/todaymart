package com.agri.market.seller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SellerService {

    private final SellerRepository sellerRepository;

    public SellerService(SellerRepository sellerRepository) {
        this.sellerRepository = sellerRepository;
    }

    /**
     * 모든 판매자 조회 (페이지네이션)
     */
    public Page<Seller> getAllSellers(Pageable pageable) {
        return sellerRepository.findAll(pageable);
    }

    /**
     * 활성 판매자만 조회
     */
    public List<Seller> getActiveSellers() {
        return sellerRepository.findByIsActiveTrue();
    }

    /**
     * 활성 판매자만 조회 (페이지네이션)
     */
    public Page<Seller> getActiveSellers(Pageable pageable) {
        return sellerRepository.findByIsActiveTrue(pageable);
    }

    /**
     * ID로 판매자 조회 (getSeller 메서드)
     */
    public Seller getSeller(Long id) {
        return getSellerById(id);
    }

    /**
     * 판매자 상태 업데이트
     */
    @Transactional
    public void updateSellerStatus(Long id, boolean isActive) {
        Seller seller = getSellerById(id);
        seller.setIsActive(isActive);
        sellerRepository.save(seller);
    }

    /**
     * ID로 판매자 조회
     */
    public Seller getSellerById(Long id) {
        return sellerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + id));
    }

    /**
     * 판매자명으로 검색
     */
    public Page<Seller> searchSellers(String name, Pageable pageable) {
        if (name == null || name.trim().isEmpty()) {
            return sellerRepository.findAll(pageable);
        }
        return sellerRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    /**
     * 활성 상태로 필터링
     */
    public Page<Seller> getSellersByActiveStatus(Boolean isActive, Pageable pageable) {
        return sellerRepository.findByIsActive(isActive, pageable);
    }

    /**
     * 판매자 등록
     */
    @Transactional
    public Seller createSeller(Seller seller) {
        // 사업자등록번호 중복 체크
        if (sellerRepository.existsByBusinessNumber(seller.getBusinessNumber())) {
            throw new RuntimeException("이미 등록된 사업자등록번호입니다: " + seller.getBusinessNumber());
        }
        return sellerRepository.save(seller);
    }

    /**
     * 판매자 정보 수정
     */
    @Transactional
    public Seller updateSeller(Long id, Seller sellerDetails) {
        Seller seller = getSellerById(id);

        // 사업자등록번호 변경 시 중복 체크
        if (!seller.getBusinessNumber().equals(sellerDetails.getBusinessNumber()) &&
            sellerRepository.existsByBusinessNumber(sellerDetails.getBusinessNumber())) {
            throw new RuntimeException("이미 등록된 사업자등록번호입니다: " + sellerDetails.getBusinessNumber());
        }

        seller.setName(sellerDetails.getName());
        seller.setBusinessNumber(sellerDetails.getBusinessNumber());
        seller.setRepresentative(sellerDetails.getRepresentative());
        seller.setPhone(sellerDetails.getPhone());
        seller.setEmail(sellerDetails.getEmail());
        seller.setAddress(sellerDetails.getAddress());
        seller.setBankName(sellerDetails.getBankName());
        seller.setAccountNumber(sellerDetails.getAccountNumber());
        seller.setAccountHolder(sellerDetails.getAccountHolder());
        seller.setCommissionRate(sellerDetails.getCommissionRate());
        seller.setIsActive(sellerDetails.getIsActive());
        seller.setMemo(sellerDetails.getMemo());

        return sellerRepository.save(seller);
    }

    /**
     * 판매자 삭제
     * 실제로는 삭제하지 않고 isActive = false로 변경 권장
     */
    @Transactional
    public void deleteSeller(Long id) {
        Seller seller = getSellerById(id);
        sellerRepository.delete(seller);
    }

    /**
     * 판매자 활성화/비활성화 토글
     */
    @Transactional
    public Seller toggleSellerStatus(Long id) {
        Seller seller = getSellerById(id);
        seller.setIsActive(!seller.getIsActive());
        return sellerRepository.save(seller);
    }

    /**
     * 사업자등록번호 중복 체크
     */
    public boolean isBusinessNumberDuplicate(String businessNumber) {
        return sellerRepository.existsByBusinessNumber(businessNumber);
    }
}
