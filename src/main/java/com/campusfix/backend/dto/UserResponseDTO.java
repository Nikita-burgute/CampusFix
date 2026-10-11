
package com.campusfix.backend.dto;

import com.campusfix.backend.enums.Role;
import com.campusfix.backend.entity.User;

public class UserResponseDTO {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private String department;
    private String phone;

    public UserResponseDTO(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.department = user.getDepartment();
        this.phone = user.getPhone();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public String getDepartment() {
        return department;
    }

    public String getPhone() {
        return phone;
    }
}
