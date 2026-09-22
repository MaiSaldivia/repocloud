package cl.duoc.api.dto;

import java.util.List;

public record ClienteDTO(
    Long id,
    String nombre,
    String email,
    List<MascotaDTO> mascotas
) {}