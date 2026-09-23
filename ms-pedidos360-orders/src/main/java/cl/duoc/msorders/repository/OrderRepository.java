package cl.duoc.msorders.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import cl.duoc.msorders.model.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
}