package cl.duoc.msorders.service;

import cl.duoc.msorders.dto.NotificationMessage;
import cl.duoc.msorders.model.Order;
import cl.duoc.msorders.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationPublisher notificationPublisher;

    public List<Order> getOrdersWithFilters(String status, LocalDateTime from, LocalDateTime to) {
        if (status != null && from != null && to != null) {
            return orderRepository.findByStatusAndCreatedAtBetween(status, from, to);
        } else if (status != null) {
            return orderRepository.findByStatus(status);
        } else if (from != null && to != null) {
            return orderRepository.findByCreatedAtBetween(from, to);
        }
        return orderRepository.findAll();
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Order createOrder(Order order) {
        Order savedOrder = orderRepository.save(order);

        // Publicar notificación a RabbitMQ al crear el pedido
        try {
            NotificationMessage notif = new NotificationMessage();
            notif.setPedidoId(savedOrder.getId());
            notif.setEmail(savedOrder.getCustomerEmail() != null ? savedOrder.getCustomerEmail() : "cliente@pedidos360.cl");
            notif.setAsunto("Nuevo Pedido Creado #" + savedOrder.getId());
            
            String detalle = savedOrder.getItemDescription() != null ? savedOrder.getItemDescription() : "Producto";
            notif.setMensaje("Tu pedido de (" + detalle + ") fue registrado exitosamente con estado CREADO.");
            
            notificationPublisher.enviarNotificacion(notif);
        } catch (Exception e) {
            System.err.println("Error publicando notificacion de nuevo pedido: " + e.getMessage());
        }

        return savedOrder;
    }

    public Optional<Order> updateOrderStatus(Long id, String newStatus) {
        return orderRepository.findById(id).map(order -> {
            String currentStatus = order.getStatus();

            // Normalizar tildes y mayúsculas para evitar fallos de codificación (ej. EN_PREPARACIÓN -> EN_PREPARACION)
            String cleanStatus = newStatus != null 
                    ? newStatus.toUpperCase().replace("Ó", "O").replace("É", "E").replace("Á", "A").replace("Í", "I").replace("Ú", "U") 
                    : "";

            // Regla de Negocio: No se puede despachar sin aceptar
            if ("DESPACHADO".equalsIgnoreCase(cleanStatus) && !"ACEPTADO".equalsIgnoreCase(currentStatus)) {
                throw new IllegalArgumentException("No se puede despachar un pedido que no ha sido ACEPTADO previamente.");
            }

            order.setStatus(cleanStatus);
            Order updatedOrder = orderRepository.save(order);

            // Publicar notificación a RabbitMQ al cambiar estado
            try {
                NotificationMessage notif = new NotificationMessage();
                notif.setPedidoId(updatedOrder.getId());
                notif.setEmail(updatedOrder.getCustomerEmail() != null ? updatedOrder.getCustomerEmail() : "cliente@pedidos360.cl");
                notif.setAsunto("Actualización de Pedido #" + updatedOrder.getId());
                notif.setMensaje("El estado de tu pedido ha cambiado a: " + updatedOrder.getStatus());
                
                notificationPublisher.enviarNotificacion(notif);
            } catch (Exception e) {
                System.err.println("Error publicando notificacion de cambio de estado: " + e.getMessage());
            }

            return updatedOrder;
        });
    }
}