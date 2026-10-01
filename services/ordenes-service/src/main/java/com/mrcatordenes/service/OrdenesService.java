package com.mrcatordenes.service;

import com.mrcatordenes.model.Orden;
import com.mrcatordenes.repository.OrdenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrdenesService {

    private final OrdenRepository repository;

    public List<Orden> obtenerTodos() {
        return repository.findAll();
    }

    public Orden obtenerPorId(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Orden con id " + id + " no existe."));
    }

    @Transactional
    public Orden crear(Map<String, Object> input) {
        Object usuarioId = input.get("usuarioId");
        if (usuarioId == null || usuarioId.toString().isBlank()) {
            throw new IllegalArgumentException("Bad Request: usuarioId es obligatorio.");
        }

        Orden.EstadoOrden estado = Orden.EstadoOrden.PENDIENTE;
        if (input.containsKey("estado") && input.get("estado") != null) {
            estado = parsearEstado(input.get("estado"));
        }

        Orden orden = Orden.builder()
            .usuarioId(usuarioId.toString())
            .estado(estado)
            .total(0.0)
            .build();
        return repository.save(orden);
    }

    @Transactional
    public Orden actualizar(String id, Map<String, Object> input) {
        Orden orden = obtenerPorId(id);
        if (input.containsKey("estado") && input.get("estado") != null) {
            orden.setEstado(parsearEstado(input.get("estado")));
        }
        return repository.save(orden);
    }

    @Transactional
    public boolean eliminar(String id) {
        if (!repository.existsById(id)) {
            return false;
        }
        repository.deleteById(id);
        return true;
    }

    @Transactional
    public Orden actualizarTotal(String id, Double total) {
        Orden orden = obtenerPorId(id);
        orden.setTotal(total);
        return repository.save(orden);
    }

    private static Orden.EstadoOrden parsearEstado(Object valor) {
        try {
            return Orden.EstadoOrden.valueOf(valor.toString().toUpperCase());
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("Bad Request: estado de orden inválido: " + valor);
        }
    }
}
