
package com.campusfix.backend.controller;

import com.campusfix.backend.dto.UserResponseDTO;
import com.campusfix.backend.entity.User;
import com.campusfix.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserResponseDTO createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);
        return new UserResponseDTO(createdUser);
    }

    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers()
                .stream()
                .map(UserResponseDTO::new)
                .toList();
    }

    @GetMapping("/{id}")
    public UserResponseDTO getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return new UserResponseDTO(user);
    }

    @PutMapping("/{id}")
    public UserResponseDTO updateUser(
            @PathVariable Long id,
            @RequestBody User user) {

        User updatedUser = userService.updateUser(id, user);
        return new UserResponseDTO(updatedUser);
    }

    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "User deleted successfully";
    }

    @PostMapping("/admin")
    public UserResponseDTO createUserByAdmin(@RequestBody User user) {
        User createdUser = userService.createUserByAdmin(user);
        return new UserResponseDTO(createdUser);
    }
}
