package org.make_it.backend.security

import org.make_it.backend.model.UserRole
import java.util.UUID

/**
 * Data class representing the authenticated user extracted from a JWT token.
 * This is used throughout the application to access the current user's information.
 *
 * @property id The user's unique identifier
 * @property email The user's email address
 * @property role The user's role (USER or ADMIN)
 */
data class AuthenticatedUser(
    val id: UUID,
    val email: String,
    val role: UserRole
)
