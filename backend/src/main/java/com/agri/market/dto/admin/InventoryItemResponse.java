package com.agri.market.dto.admin;

import com.agri.market.dto.StockStatus;
import com.agri.market.product.Product;
import com.agri.market.product.ProductOption;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class InventoryItemResponse {
    private Long id;
    private String type; // "PRODUCT" or "OPTION"
    private String name;
    private String category;
    private Integer stock;
    private Integer lowStockThreshold;
    private StockStatus stockStatus;
    private BigDecimal price;
    private BigDecimal stockValue; // stock * price

    // For ProductOption
    private Long parentProductId;
    private String parentProductName;
    private String optionName;
    private BigDecimal additionalPrice;

    public static InventoryItemResponse fromProduct(Product product) {
        InventoryItemResponse dto = new InventoryItemResponse();
        dto.setId(product.getId());
        dto.setType("PRODUCT");
        dto.setName(product.getName());
        dto.setCategory(product.getCategory());
        dto.setStock(product.getStock());
        dto.setLowStockThreshold(product.getLowStockThreshold());
        dto.setPrice(product.getPrice());

        // Calculate stock status
        if (product.getStock() == 0) {
            dto.setStockStatus(StockStatus.SOLD_OUT);
        } else if (product.getStock() <= product.getLowStockThreshold()) {
            dto.setStockStatus(StockStatus.LOW_STOCK);
        } else {
            dto.setStockStatus(StockStatus.IN_STOCK);
        }

        // Calculate stock value
        dto.setStockValue(product.getPrice().multiply(BigDecimal.valueOf(product.getStock())));

        return dto;
    }

    public static InventoryItemResponse fromProductOption(ProductOption option) {
        InventoryItemResponse dto = new InventoryItemResponse();
        dto.setId(option.getId());
        dto.setType("OPTION");
        dto.setName(option.getProduct().getName() + " - " + option.getOptionName());
        dto.setCategory(option.getProduct().getCategory());
        dto.setStock(option.getStock());
        dto.setLowStockThreshold(option.getProduct().getLowStockThreshold()); // Use parent's threshold
        dto.setOptionName(option.getOptionName());
        dto.setAdditionalPrice(option.getAdditionalPrice());

        // Parent product info
        dto.setParentProductId(option.getProduct().getId());
        dto.setParentProductName(option.getProduct().getName());

        // Calculate price (base + additional)
        BigDecimal totalPrice = option.getProduct().getPrice().add(option.getAdditionalPrice());
        dto.setPrice(totalPrice);

        // Calculate stock status (using parent's threshold)
        if (option.getStock() == 0) {
            dto.setStockStatus(StockStatus.SOLD_OUT);
        } else if (option.getStock() <= option.getProduct().getLowStockThreshold()) {
            dto.setStockStatus(StockStatus.LOW_STOCK);
        } else {
            dto.setStockStatus(StockStatus.IN_STOCK);
        }

        // Calculate stock value
        dto.setStockValue(totalPrice.multiply(BigDecimal.valueOf(option.getStock())));

        return dto;
    }
}
