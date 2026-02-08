package org.make_it.backend.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.make_it.backend.model.User
import org.make_it.backend.model.UserRole
import java.time.LocalDateTime
import java.util.UUID

/**
 * Request DTO for user registration.
 */
data class RegisterRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    @field:Size(max = 255, message = "Email must not exceed 255 characters")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    val password: String,

    @field:NotBlank(message = "Display name is required")
    @field:Size(min = 1, max = 100, message = "Display name must be between 1 and 100 characters")
    val displayName: String,

    @field:NotBlank(message = "Invite code is required")
    val inviteCode: String
)

/**
 * Request DTO for user login.
 */
data class LoginRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    val password: String
)

/**
 * Request DTO for refreshing an access token.
 */
data class RefreshTokenRequest(
    @field:NotBlank(message = "Refresh token is required")
    val refreshToken: String
)

/**
 * Response DTO for authentication operations (login, register, refresh).
 */
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserResponse
)

/**
 * Response DTO for user information.
 */
data class UserResponse(
    val id: UUID,
    val email: String,
    val displayName: String,
    val role: UserRole,
    val createdAt: LocalDateTime
) {
    companion object {
        /**
         * Factory method to create UserResponse from User entity.
         */
        fun from(user: User): UserResponse = UserResponse(
            id = user.id,
            email = user.email,
            displayName = user.displayName,
            role = user.role,
            createdAt = user.createdAt
        )
    }
}
