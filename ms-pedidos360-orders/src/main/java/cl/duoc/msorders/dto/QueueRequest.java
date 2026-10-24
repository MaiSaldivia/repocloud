package cl.duoc.msorders.dto;

import lombok.Data;

@Data
public class QueueRequest {
    
    private String name;
    private boolean durable = true;

    public boolean isInvalid() {
        return name == null || name.trim().isEmpty();
    }
}