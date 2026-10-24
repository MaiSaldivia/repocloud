package cl.duoc.msorders.service;

import cl.duoc.msorders.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void enviarNotificacion(NotificationMessage mensaje) {
        rabbitTemplate.convertAndSend("cmd.direct", "email.send", mensaje);
        log.info("Publicación solicitada para el pedido {}", mensaje.getPedidoId());
    }
}