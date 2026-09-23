package cl.duoc.msbff.dto;

import java.util.List;

public record DashboardDTO(
    List<ProductDTO> products,
    List<OrderDTO> orders
) {}