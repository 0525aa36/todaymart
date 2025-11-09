package com.agri.market.faq;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class FaqController {
    private final FaqService faqService;

    public FaqController(FaqService faqService) {
        this.faqService = faqService;
    }

    // Public endpoints
    @GetMapping("/faqs")
    public ResponseEntity<List<Faq>> getActiveFaqs() {
        return ResponseEntity.ok(faqService.getActiveFaqs());
    }

    @GetMapping("/faqs/category/{category}")
    public ResponseEntity<List<Faq>> getFaqsByCategory(@PathVariable FaqCategory category) {
        return ResponseEntity.ok(faqService.getFaqsByCategory(category));
    }

    @GetMapping("/faqs/{id}")
    public ResponseEntity<Faq> getFaqById(@PathVariable Long id) {
        return ResponseEntity.ok(faqService.getFaqById(id));
    }

    // Admin endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/faqs")
    public ResponseEntity<List<Faq>> getAllFaqs() {
        return ResponseEntity.ok(faqService.getAllFaqs());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/faqs")
    public ResponseEntity<Faq> createFaq(@RequestBody Faq faq) {
        return ResponseEntity.ok(faqService.createFaq(faq));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/faqs/{id}")
    public ResponseEntity<Faq> updateFaq(@PathVariable Long id, @RequestBody Faq faq) {
        return ResponseEntity.ok(faqService.updateFaq(id, faq));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/faqs/{id}")
    public ResponseEntity<Void> deleteFaq(@PathVariable Long id) {
        faqService.deleteFaq(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/faqs/{id}/toggle")
    public ResponseEntity<Faq> toggleFaqStatus(@PathVariable Long id) {
        return ResponseEntity.ok(faqService.toggleFaqStatus(id));
    }
}
