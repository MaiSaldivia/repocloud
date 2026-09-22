package cl.duoc.api.dto;

public record MascotaDTO(
    Long id,
    String nombre,
    String tipo,
    Integer edad
) {}