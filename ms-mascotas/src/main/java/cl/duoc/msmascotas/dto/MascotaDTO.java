package cl.duoc.msmascotas.dto;

public record MascotaDTO(
    Long id,
    String nombre,
    String tipo,
    Integer edad
) {}