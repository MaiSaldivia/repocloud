package cl.duoc.msbff.service;

import cl.duoc.msbff.dto.DashboardDTO;
import cl.duoc.msbff.dto.OrderDTO;
import cl.duoc.msbff.dto.ProductDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class DataService {

    private final RestClient restClientCatalog;
    private final RestClient restClientOrders;

    public DataService(
            @Value("${services.catalog.url:http://172.31.20.23:8081}") String catalogUrl,
            @Value("${services.orders.url:http://172.31.20.23:8082}") String ordersUrl) {

        this.restClientCatalog = RestClient.builder()
                .baseUrl(catalogUrl)
                .build();

        this.restClientOrders = RestClient.builder()
                .baseUrl(ordersUrl)
                .build();
    }

    // --- MÉTODOS DE CATÁLOGO ---
    public List<ProductDTO> obtenerProductos() {
        return restClientCatalog.get()
                .uri("/api/catalog/products")
                .retrieve()
                .body(new ParameterizedTypeReference<List<ProductDTO>>() {});
    }

    public ProductDTO obtenerProductoPorId(Long id) {
        return restClientCatalog.get()
                .uri("/api/catalog/products/" + id)
                .retrieve()
                .body(ProductDTO.class);
    }

    public ProductDTO crearProducto(ProductDTO producto) {
        return restClientCatalog.post()
                .uri("/api/catalog/products")
                .body(producto)
                .retrieve()
                .body(ProductDTO.class);
    }

    public ProductDTO actualizarProducto(Long id, ProductDTO producto) {
        return restClientCatalog.put()
                .uri("/api/catalog/products/" + id)
                .body(producto)
                .retrieve()
                .body(ProductDTO.class);
    }

    public void eliminarProducto(Long id) {
        restClientCatalog.delete()
                .uri("/api/catalog/products/" + id)
                .retrieve()
                .toBodilessEntity();
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

    // --- ACTUALIZACIÓN DE ESTADO DE PEDIDO Y DESCUENTO DE STOCK ---
    public OrderDTO actualizarEstadoPedido(Long id, String status) {
        OrderDTO order = restClientOrders.put()
                .uri("/api/orders/" + id + "/status")
                .body(java.util.Map.of("status", status))
                .retrieve()
                .body(OrderDTO.class);

        // Regla clave: Descontar stock en catálogo al pasar a ACEPTADO
        if ("ACEPTADO".equalsIgnoreCase(status) && order != null && order.productId() != null) {
            try {
                ProductDTO product = obtenerProductoPorId(order.productId());
                if (product != null && product.stock() != null) {
                    int cantidadADescontar = order.quantity() != null ? order.quantity() : 1;
                    int nuevoStock = Math.max(0, product.stock() - cantidadADescontar);
                    
                    // Al ser un 'record' de Java, instanciamos uno nuevo con el stock actualizado
                    ProductDTO productoActualizado = new ProductDTO(
                        product.id(),
                        product.name(),
                        product.description(),
                        product.price(),
                        nuevoStock
                    );

                    actualizarProducto(product.id(), productoActualizado);
                }
            } catch (Exception e) {
                System.err.println("Error al actualizar el stock del producto ID " + order.productId() + ": " + e.getMessage());
            }
        }

        return order;
    }
}