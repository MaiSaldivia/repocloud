package cl.duoc.msclientes.service;

import org.springframework.stereotype.Service;

import cl.duoc.msclientes.dto.ClienteDTO;

@Service
public class ClienteService {

    public ClienteDTO obtenerClientePorId(Long id) {
        // Simulación de datos provenientes de base de datos
        return new ClienteDTO(id, "Wacoldo Soto", "wacoldo.soto@duocuc.cl");
    }
}