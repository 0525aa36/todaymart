package com.agri.market.seller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SellerService {

    private final SellerRepository sellerRepository;

    public SellerService(SellerRepository sellerRepository) {
        this.sellerRepository = sellerRepository;
    }

    /**
     * 판매자 생성
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
     * 판매자 수정
     */
    @Transactional
    public Seller updateSeller(Long id, Seller sellerDetails) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + id));

        // 사업자등록번호가 변경되었다면 중복 체크
        if (!seller.getBusinessNumber().equals(sellerDetails.getBusinessNumber())) {
            if (sellerRepository.existsByBusinessNumber(sellerDetails.getBusinessNumber())) {
                throw new RuntimeException("이미 등록된 사업자등록번호입니다: " + sellerDetails.getBusinessNumber());
            }
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
     * 판매자 조회
     */
    @Transactional(readOnly = true)
    public Seller getSeller(Long id) {
        return sellerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + id));
    }

    /**
     * 모든 판매자 조회
     */
    @Transactional(readOnly = true)
    public Page<Seller> getAllSellers(Pageable pageable) {
        return sellerRepository.findAll(pageable);
    }

    /**
     * 판매자 검색
     */
    @Transactional(readOnly = true)
    public Page<Seller> searchSellers(String query, Pageable pageable) {
        return sellerRepository.findByNameContaining(query, pageable);
    }

    /**
     * 활성화된 판매자만 조회
     */
    @Transactional(readOnly = true)
    public Page<Seller> getActiveSellers(Pageable pageable) {
        return sellerRepository.findByIsActiveTrue(pageable);
    }

    /**
     * 판매자 활성화/비활성화
     */
    @Transactional
    public void updateSellerStatus(Long id, boolean isActive) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + id));
        seller.setIsActive(isActive);
        sellerRepository.save(seller);
    }

    /**
     * 판매자 삭제
     */
    @Transactional
    public void deleteSeller(Long id) {
        if (!sellerRepository.existsById(id)) {
            throw new RuntimeException("판매자를 찾을 수 없습니다: " + id);
        }
        sellerRepository.deleteById(id);
    }
}
