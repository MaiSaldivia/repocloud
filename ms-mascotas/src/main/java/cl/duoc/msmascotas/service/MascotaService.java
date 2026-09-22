package cl.duoc.msmascotas.service;

import cl.duoc.msmascotas.dto.MascotaDTO;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MascotaService {

    public List<MascotaDTO> obtenerMascotasPorClienteId(Long clienteId) {
        // Datos en duro según requerimiento de la guía para el cliente 1
        return List.of(
            new MascotaDTO(1L, "Firulais", "Perro", 5),
            new MascotaDTO(2L, "Michi", "Gato", 3)
        );
    }
}