package org.make_it.backend.config

import org.make_it.backend.security.JwtAuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

/**
 * Security configuration for the application.
 * Configures JWT-based stateless authentication with appropriate endpoint permissions.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val userDetailsService: UserDetailsService
) {

    /**
     * Configures the security filter chain.
     * - Disables CSRF (stateless JWT authentication)
     * - Configures stateless session management
     * - Sets up endpoint authorization rules
     * - Adds JWT filter before UsernamePasswordAuthenticationFilter
     */
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .sessionManagement { session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .authorizeHttpRequests { auth ->
                auth
                    // Public endpoints - authentication
                    .requestMatchers("/api/auth/register").permitAll()
                    .requestMatchers("/api/auth/login").permitAll()
                    .requestMatchers("/api/auth/refresh").permitAll()
                    // Public endpoint - invite code validation
                    .requestMatchers(HttpMethod.GET, "/api/invites/*/validate").permitAll()
                    // Actuator health endpoint
                    .requestMatchers("/actuator/health").permitAll()
                    .requestMatchers("/actuator/health/**").permitAll()
                    // CORS preflight requests
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    // All other API endpoints require authentication
                    .requestMatchers("/api/**").authenticated()
                    // Deny all other requests
                    .anyRequest().denyAll()
            }
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    /**
     * BCrypt password encoder with cost factor 12.
     * Higher cost factor means more secure but slower hashing.
     */
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder(12)
    }

    /**
     * Authentication provider using the custom UserDetailsService and BCrypt encoder.
     */
    @Bean
    fun authenticationProvider(): AuthenticationProvider {
        val authProvider = DaoAuthenticationProvider(userDetailsService)
        authProvider.setPasswordEncoder(passwordEncoder())
        return authProvider
    }

    /**
     * Authentication manager for programmatic authentication.
     */
    @Bean
    fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager {
        return config.authenticationManager
    }
}
