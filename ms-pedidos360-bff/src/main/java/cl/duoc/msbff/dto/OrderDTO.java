package cl.duoc.msbff.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderDTO(
    Long id,
    String customerEmail,
    BigDecimal totalAmount,
    String status,
    LocalDateTime createdAt
) {}