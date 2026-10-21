package cl.duoc.msorders.repository;

import cl.duoc.msorders.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(String status);
    List<Order> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    List<Order> findByStatusAndCreatedAtBetween(String status, LocalDateTime from, LocalDateTime to);
}