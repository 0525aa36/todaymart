package com.agri.market.returnrequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 반품 요청 컨트롤러 (사용자용)
 */
@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    /**
     * 반품 가능 여부 확인
     * GET /api/returns/eligibility/{orderId}
     */
    @GetMapping("/eligibility/{orderId}")
    public ResponseEntity<ReturnEligibilityResponse> checkReturnEligibility(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        ReturnEligibilityResponse response = returnService.checkReturnEligibility(orderId, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * 반품 요청 생성
     * POST /api/returns
     */
    @PostMapping
    public ResponseEntity<ReturnRequest> createReturnRequest(
            @Valid @RequestBody CreateReturnRequestDto dto,
            Authentication authentication
    ) {
        ReturnRequest returnRequest = returnService.createReturnRequest(dto, authentication);
        return ResponseEntity.ok(returnRequest);
    }

    /**
     * 내 반품 요청 목록 조회
     * GET /api/returns/my
     */
    @GetMapping("/my")
    public ResponseEntity<List<ReturnRequest>> getMyReturnRequests(Authentication authentication) {
        List<ReturnRequest> returnRequests = returnService.getUserReturnRequests(authentication);
        return ResponseEntity.ok(returnRequests);
    }

    /**
     * 반품 요청 상세 조회
     * GET /api/returns/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReturnRequest> getReturnRequest(
            @PathVariable Long id,
            Authentication authentication
    ) {
        ReturnRequest returnRequest = returnService.getReturnRequest(id, authentication);
        return ResponseEntity.ok(returnRequest);
    }

    /**
     * 반품 요청 취소
     * DELETE /api/returns/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelReturnRequest(
            @PathVariable Long id,
            Authentication authentication
    ) {
        returnService.cancelReturnRequest(id, authentication);
        return ResponseEntity.noContent().build();
    }
}
