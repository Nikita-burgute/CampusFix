
package com.campusfix.backend.config;

import com.campusfix.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/test"
                        ).permitAll()

                        // User registration
                        .requestMatchers(HttpMethod.POST, "/api/users")
                        .permitAll()

                        // Admin creation
                        .requestMatchers(HttpMethod.POST, "/api/users/admin")
                        .hasRole("ADMIN")

                        // Current authenticated user's profile
                        .requestMatchers(HttpMethod.GET, "/api/users/me")
                        .authenticated()

                        // Only ADMIN can manage or view users
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users",
                                "/api/users/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/users/**"
                        ).hasRole("ADMIN")

                        // Only ADMIN can create assignments
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/assignments"
                        ).hasRole("ADMIN")

                        // Students can create complaints
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/complaints"
                        ).hasRole("STUDENT")

                        // Users can retrieve their own complaints.
                        // Ownership filtering is handled by the service.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/complaints/my"
                        ).authenticated()

                        // Individual complaint access is authenticated.
                        // ComplaintService checks ADMIN or assigned TECHNICIAN.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/complaints/*"
                        ).authenticated()

                        // Only ADMIN can view all complaints
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/complaints"
                        ).hasRole("ADMIN")

                        // Only ADMIN can verify resolutions
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/complaints/*/verify"
                        ).hasRole("ADMIN")

                        // Only TECHNICIAN can start or resolve assigned work.
                        // Service methods validate assignment and status.
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/complaints/*/start",
                                "/api/complaints/*/resolve"
                        ).hasRole("TECHNICIAN")

                        // Only ADMIN can perform other complaint updates
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/complaints/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/complaints/**"
                        ).hasRole("ADMIN")

                        // All other endpoints require authentication
                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }
}
