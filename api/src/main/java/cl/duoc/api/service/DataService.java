package cl.duoc.api.service;

import cl.duoc.api.dto.ClienteDTO;
import cl.duoc.api.dto.MascotaDTO;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class DataService {

    private final RestClient restClientClientes;
    private final RestClient restClientMascotas;

    public DataService() {
        this.restClientClientes = RestClient.builder()
                .baseUrl("http://localhost:8081")
                .build();

        this.restClientMascotas = RestClient.builder()
                .baseUrl("http://localhost:8082")
                .build();
    }

    public ClienteDTO obtenerData() {
        // 1. Obtener cliente desde ms-clientes (:8081)
        ClienteDTO clienteBase = restClientClientes.get()
                .uri("/api/clientes/1")
                .retrieve()
                .body(ClienteDTO.class);

        // 2. Obtener mascotas desde ms-mascotas (:8082)
        List<MascotaDTO> mascotas = restClientMascotas.get()
                .uri("/api/mascotas/cliente/1")
                .retrieve()
                .body(new ParameterizedTypeReference<List<MascotaDTO>>() {});

        // 3. Devolver DTO unificado
        return new ClienteDTO(
                clienteBase.id(),
                clienteBase.nombre(),
                clienteBase.email(),
                mascotas
        );
    }
}