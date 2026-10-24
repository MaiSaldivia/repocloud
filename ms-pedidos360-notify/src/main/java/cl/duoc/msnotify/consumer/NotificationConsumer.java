package cl.duoc.msnotify.consumer;

import cl.duoc.msnotify.dto.NotificationMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "${rabbitmq.queues.email:q.cmd.email}")
    public void recibirMensaje(byte[] contenido) {
        try {
            NotificationMessage mensaje = objectMapper.readValue(contenido, NotificationMessage.class);
            log.info("==========================================");
            log.info("--- NOTIFICACIÓN RECIBIDA EN CONSUMIDOR ---");
            log.info("Pedido ID   : {}", mensaje.getPedidoId());
            log.info("Destinatario : {}", mensaje.getEmail());
            log.info("Asunto      : {}", mensaje.getAsunto());
            log.info("Mensaje     : {}", mensaje.getMensaje());
            log.info("==========================================");
        } catch (Exception e) {
            log.error("Error al procesar la notificación: {}. Redirigiendo a DLQ...", e.getMessage());
            // Relanzar la excepción le indica a Spring AMQP realizar un NACK y enviar el mensaje a la DLQ
            throw new RuntimeException("Error en la lectura del mensaje de notificación", e);
        }
    }
}