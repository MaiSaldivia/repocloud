package cl.duoc.msbff.service;

import cl.duoc.msbff.dto.DashboardDTO;
import cl.duoc.msbff.dto.OrderDTO;
import cl.duoc.msbff.dto.ProductDTO;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class DataService {

    private final RestClient restClientCatalog;
    private final RestClient restClientOrders;

    public DataService() {
        this.restClientCatalog = RestClient.builder()
                .baseUrl("http://localhost:8081")
                .build();

        this.restClientOrders = RestClient.builder()
                .baseUrl("http://localhost:8082")
                .build();
    }

    // --- MÉTODOS DE CATÁLOGO ---
    public List<ProductDTO> obtenerProductos() {
        return restClientCatalog.get()
                .uri("/api/catalog/products")
                .retrieve()
                .body(new ParameterizedTypeReference<List<ProductDTO>>() {});
    }

    public ProductDTO crearProducto(ProductDTO producto) {
        return restClientCatalog.post()
                .uri("/api/catalog/products")
                .body(producto)
                .retrieve()
                .body(ProductDTO.class);
    }

    // --- MÉTODOS DE PEDIDOS ---
    public List<OrderDTO> obtenerPedidos() {
        return restClientOrders.get()
                .uri("/api/orders")
                .retrieve()
                .body(new ParameterizedTypeReference<List<OrderDTO>>() {});
    }

    public OrderDTO crearPedido(OrderDTO pedido) {
        return restClientOrders.post()
                .uri("/api/orders")
                .body(pedido)
                .retrieve()
                .body(OrderDTO.class);
    }

    // --- DASHBOARD UNIFICADO (BFF) ---
    public DashboardDTO obtenerDashboard() {
        List<ProductDTO> productos = obtenerProductos();
        List<OrderDTO> pedidos = obtenerPedidos();
        return new DashboardDTO(productos, pedidos);
    }
}