package cl.duoc.msorders.controller;

import cl.duoc.msorders.dto.QueueRequest;
import cl.duoc.msorders.service.RabbitAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/queues")
@RequiredArgsConstructor
public class AdminQueueController {

    private final RabbitAdminService rabbitAdminService;

    @PostMapping
    public ResponseEntity<?> createQueue(@RequestBody QueueRequest request) {
        if (request.isInvalid()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de la cola no puede estar vacio"));
        }
        try {
            String declaredName = rabbitAdminService.createQueue(request.getName(), request.isDurable());
            return ResponseEntity.ok(Map.of("message", "Cola creada exitosamente", "queue", declaredName));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al crear cola en RabbitMQ", "detalle", e.getMessage()));
        }
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<?> deleteQueue(@PathVariable String name) {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nombre de cola invalido"));
        }
        try {
            boolean deleted = rabbitAdminService.deleteQueue(name);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Cola eliminada exitosamente", "queue", name));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al eliminar cola en RabbitMQ", "detalle", e.getMessage()));
        }
    }
}