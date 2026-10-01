package com.mrcatordenes.graphql;

import com.mrcatordenes.model.Orden;
import com.mrcatordenes.service.OrdenesService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class OrdenesResolver {

    private final OrdenesService service;

    @QueryMapping
    public List<Orden> ordenes() {
        return service.obtenerTodos();
    }

    @QueryMapping
    public Orden orden(@Argument String id) {
        return service.obtenerPorId(id);
    }

    @MutationMapping
    public Orden crearOrden(@Argument Map<String, Object> input) {
        return service.crear(input);
    }

    @MutationMapping
    public Orden actualizarOrden(@Argument String id, @Argument Map<String, Object> input) {
        return service.actualizar(id, input);
    }

    @MutationMapping
    public boolean eliminarOrden(@Argument String id) {
        return service.eliminar(id);
    }
}
