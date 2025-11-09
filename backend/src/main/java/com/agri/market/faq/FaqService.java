package com.agri.market.faq;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FaqService {
    private final FaqRepository faqRepository;

    public FaqService(FaqRepository faqRepository) {
        this.faqRepository = faqRepository;
    }

    @Transactional(readOnly = true)
    public List<Faq> getAllFaqs() {
        return faqRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Faq> getActiveFaqs() {
        return faqRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Faq> getFaqsByCategory(FaqCategory category) {
        return faqRepository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc(category);
    }

    @Transactional(readOnly = true)
    public Faq getFaqById(Long id) {
        return faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ를 찾을 수 없습니다."));
    }

    @Transactional
    public Faq createFaq(Faq faq) {
        return faqRepository.save(faq);
    }

    @Transactional
    public Faq updateFaq(Long id, Faq faqDetails) {
        Faq faq = getFaqById(id);
        faq.setCategory(faqDetails.getCategory());
        faq.setQuestion(faqDetails.getQuestion());
        faq.setAnswer(faqDetails.getAnswer());
        faq.setDisplayOrder(faqDetails.getDisplayOrder());
        faq.setIsActive(faqDetails.getIsActive());
        return faqRepository.save(faq);
    }

    @Transactional
    public void deleteFaq(Long id) {
        faqRepository.deleteById(id);
    }

    @Transactional
    public Faq toggleFaqStatus(Long id) {
        Faq faq = getFaqById(id);
        faq.setIsActive(!faq.getIsActive());
        return faqRepository.save(faq);
    }
}
