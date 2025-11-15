package com.agri.market.dto.admin;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkStockUpdateRequest {
    private List<StockUpdateItem> items;
}
