package org.make_it.backend.controller

import jakarta.validation.Valid
import org.make_it.backend.dto.AuthResponse
import org.make_it.backend.dto.LoginRequest
import org.make_it.backend.dto.RefreshTokenRequest
import org.make_it.backend.dto.RegisterRequest
import org.make_it.backend.dto.UserResponse
import org.make_it.backend.security.AuthenticatedUser
import org.make_it.backend.service.AuthService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * REST controller for authentication operations.
 * Provides endpoints for registration, login, token refresh, logout, and user info.
 */
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {
    private val logger = LoggerFactory.getLogger(AuthController::class.java)

    /**
     * Registers a new user account.
     *
     * POST /api/auth/register
     *
     * @param request The registration request with email, password, display name, and invite code
     * @return AuthResponse with access token, refresh token, and user information
     */
    @PostMapping("/register")
    fun register(
        @Valid @RequestBody request: RegisterRequest
    ): ResponseEntity<AuthResponse> {
        logger.info("POST /api/auth/register - Registering user with email: {}", request.email)

        val response = authService.register(request)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response)
    }

    /**
     * Authenticates a user and returns tokens.
     *
     * POST /api/auth/login
     *
     * @param request The login request with email and password
     * @return AuthResponse with access token, refresh token, and user information
     */
    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest
    ): ResponseEntity<AuthResponse> {
        logger.info("POST /api/auth/login - Login attempt for email: {}", request.email)

        val response = authService.login(request)
        return ResponseEntity.ok(response)
    }

    /**
     * Refreshes an access token using a refresh token.
     *
     * POST /api/auth/refresh
     *
     * @param request The refresh token request
     * @return AuthResponse with new access token, new refresh token, and user information
     */
    @PostMapping("/refresh")
    fun refreshToken(
        @Valid @RequestBody request: RefreshTokenRequest
    ): ResponseEntity<AuthResponse> {
        logger.info("POST /api/auth/refresh - Token refresh requested")

        val response = authService.refreshToken(request)
        return ResponseEntity.ok(response)
    }

    /**
     * Logs out the current user by revoking all their refresh tokens.
     *
     * POST /api/auth/logout
     *
     * @param user The authenticated user (from JWT token)
     * @return HTTP 204 No Content on success
     */
    @PostMapping("/logout")
    fun logout(
        @AuthenticationPrincipal user: AuthenticatedUser
    ): ResponseEntity<Unit> {
        logger.info("POST /api/auth/logout - Logout for user: {}", user.id)

        authService.logout(user.id)
        return ResponseEntity.noContent().build()
    }

    /**
     * Returns information about the currently authenticated user.
     *
     * GET /api/auth/me
     *
     * @param user The authenticated user (from JWT token)
     * @return UserResponse with user information
     */
    @GetMapping("/me")
    fun getCurrentUser(
        @AuthenticationPrincipal user: AuthenticatedUser
    ): ResponseEntity<UserResponse> {
        logger.info("GET /api/auth/me - Getting current user info for: {}", user.id)

        val response = authService.getUserById(user.id)
        return ResponseEntity.ok(response)
    }
}
