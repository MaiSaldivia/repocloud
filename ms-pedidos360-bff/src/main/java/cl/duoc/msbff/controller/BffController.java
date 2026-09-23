package cl.duoc.msbff.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.duoc.msbff.dto.DashboardDTO;
import cl.duoc.msbff.dto.OrderDTO;
import cl.duoc.msbff.dto.ProductDTO;
import cl.duoc.msbff.service.DataService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BffController {

    @Autowired
    private DataService dataService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard() {
        return ResponseEntity.ok(dataService.obtenerDashboard());
    }

    @GetMapping("/catalog/products")
    public ResponseEntity<List<ProductDTO>> getProducts() {
        return ResponseEntity.ok(dataService.obtenerProductos());
    }

    @PostMapping("/catalog/products")
    public ResponseEntity<ProductDTO> createProduct(@RequestBody ProductDTO product) {
        return ResponseEntity.ok(dataService.crearProducto(product));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDTO>> getOrders() {
        return ResponseEntity.ok(dataService.obtenerPedidos());
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderDTO> createOrder(@RequestBody OrderDTO order) {
        return ResponseEntity.ok(dataService.crearPedido(order));
    }
}