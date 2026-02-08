package org.make_it.backend.repository

import org.make_it.backend.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for User entity operations.
 * Provides methods for user lookup and existence checks.
 */
@Repository
interface UserRepository : JpaRepository<User, UUID> {

    /**
     * Find a user by their email address.
     * Email comparison should be case-insensitive in the application layer.
     *
     * @param email The user's email address
     * @return Optional containing the user if found
     */
    fun findByEmail(email: String): Optional<User>

    /**
     * Check if a user exists with the given email address.
     *
     * @param email The email address to check
     * @return true if a user with this email exists
     */
    fun existsByEmail(email: String): Boolean
}
