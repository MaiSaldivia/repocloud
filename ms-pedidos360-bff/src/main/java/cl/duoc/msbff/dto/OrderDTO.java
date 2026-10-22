package cl.duoc.msbff.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderDTO(
    Long id,
    String customerEmail,
    Long productId,
    String itemDescription,
    Integer quantity,
    BigDecimal totalAmount,
    String status,
    LocalDateTime createdAt
) {}