package com.agri.market.dto.admin;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkOrderStatusUpdateRequest {
    private List<Long> orderIds;
    private String status;
    private String reason; // Optional reason for status change
}
