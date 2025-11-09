package com.agri.market.inquiry;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class InquiryController {
    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    // User endpoints
    @GetMapping("/inquiries")
    public ResponseEntity<List<Inquiry>> getUserInquiries(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(inquiryService.getUserInquiries(userDetails.getUsername()));
    }

    @GetMapping("/inquiries/{id}")
    public ResponseEntity<Inquiry> getInquiryById(@PathVariable Long id, Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(inquiryService.getInquiryById(id, userDetails.getUsername()));
    }

    @PostMapping("/inquiries")
    public ResponseEntity<Inquiry> createInquiry(@RequestBody Inquiry inquiry, Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(inquiryService.createInquiry(inquiry, userDetails.getUsername()));
    }

    @DeleteMapping("/inquiries/{id}")
    public ResponseEntity<Void> deleteInquiry(@PathVariable Long id, Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        inquiryService.deleteInquiry(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // Admin endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/inquiries")
    public ResponseEntity<List<Inquiry>> getAllInquiries() {
        return ResponseEntity.ok(inquiryService.getAllInquiries());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/inquiries/{id}/answer")
    public ResponseEntity<Inquiry> answerInquiry(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String answer = payload.get("answer");
        return ResponseEntity.ok(inquiryService.answerInquiry(id, answer, userDetails.getUsername()));
    }
}
