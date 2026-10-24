package cl.duoc.msorders.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RabbitAdminService {

    private final AmqpAdmin amqpAdmin;

    public String createQueue(String name, boolean durable) {
        try {
            Queue queue = QueueBuilder.durable(name).build();
            amqpAdmin.declareQueue(queue);
            log.info("Cola declarada exitosamente: {}", name);
            return name;
        } catch (Exception e) {
            log.error("Error al crear la cola en RabbitMQ: {}", e.getMessage(), e);
            throw new RuntimeException("No se pudo crear la cola: " + e.getMessage());
        }
    }

    public boolean deleteQueue(String name) {
        try {
            boolean result = amqpAdmin.deleteQueue(name);
            log.info("Eliminación de cola {}: {}", name, result);
            return result;
        } catch (Exception e) {
            log.error("Error al eliminar la cola en RabbitMQ: {}", e.getMessage(), e);
            throw new RuntimeException("No se pudo eliminar la cola: " + e.getMessage());
        }
    }
}