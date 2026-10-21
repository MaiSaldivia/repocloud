package cl.duoc.msorders.service;

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
        return orderRepository.save(order);
    }

    public Optional<Order> updateOrderStatus(Long id, String newStatus) {
        return orderRepository.findById(id).map(order -> {
            String currentStatus = order.getStatus();

            // Regla de Negocio: No se puede "despachar" sin "aceptar"
            if ("DESPACHADO".equalsIgnoreCase(newStatus) && !"ACEPTADO".equalsIgnoreCase(currentStatus)) {
                throw new IllegalArgumentException("No se puede despachar un pedido que no ha sido ACEPTADO previamente.");
            }

            order.setStatus(newStatus.toUpperCase());
            return orderRepository.save(order);
        });
    }
}