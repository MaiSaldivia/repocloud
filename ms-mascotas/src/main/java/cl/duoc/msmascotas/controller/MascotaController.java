package cl.duoc.msmascotas.controller;

import cl.duoc.msmascotas.dto.MascotaDTO;
import cl.duoc.msmascotas.service.MascotaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/mascotas")
public class MascotaController {

    private final MascotaService mascotaService;

    public MascotaController(MascotaService mascotaService) {
        this.mascotaService = mascotaService;
    }

    @GetMapping("/cliente/{clienteId}")
    public List<MascotaDTO> obtenerMascotasPorCliente(@PathVariable Long clienteId) {
        return mascotaService.obtenerMascotasPorClienteId(clienteId);
    }
}