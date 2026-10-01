package com.mrcatusuarios.service;

import com.mrcatusuarios.model.Usuario;
import com.mrcatusuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UsuariosService {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UsuarioRepository repository;

    public List<Usuario> obtenerTodos() {
        return repository.findAll();
    }

    public Usuario obtenerPorId(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario con id " + id + " no existe."));
    }

    @Transactional
    public Usuario crear(Map<String, Object> input) {
        String nombre = texto(input.get("nombre"));
        String email = texto(input.get("email"));
        String telefono = textoOpcional(input.get("telefono"));

        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("Bad Request: el nombre es obligatorio.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Bad Request: el email es obligatorio.");
        }
        if (!EMAIL.matcher(email).matches()) {
            throw new IllegalArgumentException("Bad Request: el email no es válido.");
        }
        String emailNormalizado = email.toLowerCase();
        if (repository.existsByEmail(emailNormalizado)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email.");
        }

        Usuario usuario = Usuario.builder()
            .nombre(nombre.trim())
            .email(emailNormalizado)
            .telefono(telefono)
            .activo(true)
            .build();
        return repository.save(usuario);
    }

    @Transactional
    public Usuario actualizar(String id, Map<String, Object> input) {
        Usuario usuario = obtenerPorId(id);

        if (input.containsKey("nombre")) {
            String nombre = texto(input.get("nombre"));
            if (nombre == null || nombre.isBlank()) {
                throw new IllegalArgumentException("Bad Request: el nombre es obligatorio.");
            }
            usuario.setNombre(nombre.trim());
        }

        if (input.containsKey("email")) {
            String email = texto(input.get("email"));
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Bad Request: el email es obligatorio.");
            }
            if (!EMAIL.matcher(email).matches()) {
                throw new IllegalArgumentException("Bad Request: el email no es válido.");
            }
            String emailNormalizado = email.toLowerCase();
            if (!emailNormalizado.equals(usuario.getEmail())
                    && repository.existsByEmail(emailNormalizado)) {
                throw new IllegalArgumentException("Ya existe un usuario con ese email.");
            }
            usuario.setEmail(emailNormalizado);
        }

        if (input.containsKey("telefono")) {
            usuario.setTelefono(textoOpcional(input.get("telefono")));
        }

        if (input.containsKey("activo")) {
            Object activo = input.get("activo");
            if (activo == null) {
                throw new IllegalArgumentException("Bad Request: activo no puede ser nulo.");
            }
            usuario.setActivo(Boolean.parseBoolean(activo.toString()));
        }

        return repository.save(usuario);
    }

    @Transactional
    public boolean eliminar(String id) {
        if (!repository.existsById(id)) {
            return false;
        }
        repository.deleteById(id);
        return true;
    }

    private static String texto(Object valor) {
        return valor == null ? null : valor.toString().trim();
    }

    private static String textoOpcional(Object valor) {
        String texto = texto(valor);
        return (texto == null || texto.isBlank()) ? null : texto;
    }
}
