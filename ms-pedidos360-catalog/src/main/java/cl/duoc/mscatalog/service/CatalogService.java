package cl.duoc.mscatalog.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import cl.duoc.mscatalog.model.Product;
import cl.duoc.mscatalog.repository.ProductRepository;

@Service
public class CatalogService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public Optional<Product> updateProduct(Long id, Product details) {
        return productRepository.findById(id).map(product -> {
            product.setName(details.getName());
            product.setDescription(details.getDescription());
            product.setPrice(details.getPrice());
            product.setStock(details.getStock());
            return productRepository.save(product);
        });
    }
}