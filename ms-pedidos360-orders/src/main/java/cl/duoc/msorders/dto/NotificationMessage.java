package cl.duoc.msorders.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private Long pedidoId;
    private String email;
    private String asunto;
    private String mensaje;
}