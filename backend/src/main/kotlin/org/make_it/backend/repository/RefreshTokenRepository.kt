package org.make_it.backend.repository

import org.make_it.backend.model.RefreshToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for RefreshToken entity operations.
 * Provides methods for token lookup, revocation, and cleanup.
 */
@Repository
interface RefreshTokenRepository : JpaRepository<RefreshToken, UUID> {

    /**
     * Find a refresh token by its token string.
     *
     * @param token The refresh token string
     * @return Optional containing the refresh token if found
     */
    fun findByToken(token: String): Optional<RefreshToken>

    /**
     * Revoke all refresh tokens for a specific user.
     * This is used during logout to invalidate all sessions.
     *
     * @param userId The user's UUID
     * @return Number of tokens revoked
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user.id = :userId AND rt.revoked = false")
    fun revokeAllByUserId(@Param("userId") userId: UUID): Int

    /**
     * Delete all expired refresh tokens.
     * Should be called periodically to clean up the database.
     *
     * @param now The current timestamp for comparison
     * @return Number of tokens deleted
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    fun deleteExpiredTokens(@Param("now") now: LocalDateTime): Int

    /**
     * Find all active (non-revoked, non-expired) refresh tokens for a user.
     *
     * @param userId The user's UUID
     * @return List of active refresh tokens
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user.id = :userId AND rt.revoked = false AND rt.expiresAt > :now")
    fun findActiveTokensByUserId(
        @Param("userId") userId: UUID,
        @Param("now") now: LocalDateTime = LocalDateTime.now()
    ): List<RefreshToken>
}
