package com.agri.market.dto.admin;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockUpdateItem {
    private Long id;
    private String type; // "PRODUCT" or "OPTION"
    private Integer newStock;
}
