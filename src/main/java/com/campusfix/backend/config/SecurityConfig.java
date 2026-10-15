
package com.campusfix.backend.config;

import com.campusfix.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;

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
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(
                                        HttpServletResponse.SC_UNAUTHORIZED,
                                        "Unauthorized"
                                )
                        )
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                response.sendError(
                                        HttpServletResponse.SC_FORBIDDEN,
                                        "Forbidden"
                                )
                        )
                )


                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/test").permitAll()

                        // Public registration
                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/users"
                        ).permitAll()

                        // Only ADMIN can create users with custom roles
                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/users/admin"
                        ).hasRole("ADMIN")

                        // Current authenticated user's profile
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/users/me"
                        ).authenticated()

                        // Only ADMIN can view all users or individual users
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/users",
                                "/api/users/**"
                        ).hasRole("ADMIN")

                        // Only ADMIN can assign complaints
                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/assignments"
                        ).hasRole("ADMIN")

                        // Students can create complaints
                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/complaints"
                        ).hasRole("STUDENT")

                        // Authenticated users can retrieve their own complaints
                        // Ownership filtering is performed by getMyComplaints()
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/complaints/my"
                        ).authenticated()

                        // Only ADMIN can view all complaints or individual complaints
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/complaints",
                                "/api/complaints/*"
                        ).hasRole("ADMIN")

                        // Only ADMIN can verify resolutions
                        .requestMatchers(
                                org.springframework.http.HttpMethod.PUT,
                                "/api/complaints/*/verify"
                        ).hasRole("ADMIN")

                        // Only TECHNICIAN can start or resolve complaints
                        .requestMatchers(
                                org.springframework.http.HttpMethod.PUT,
                                "/api/complaints/*/start",
                                "/api/complaints/*/resolve"
                        ).hasRole("TECHNICIAN")

                        // Only ADMIN can directly update complaints
                        .requestMatchers(
                                org.springframework.http.HttpMethod.PUT,
                                "/api/complaints/**"
                        ).hasRole("ADMIN")

                        // Only ADMIN can delete complaints
                        .requestMatchers(
                                org.springframework.http.HttpMethod.DELETE,
                                "/api/complaints/**"
                        ).hasRole("ADMIN")

                        // Only ADMIN can update or delete users
                        .requestMatchers(
                                org.springframework.http.HttpMethod.PUT,
                                "/api/users/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(
                                org.springframework.http.HttpMethod.DELETE,
                                "/api/users/**"
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

