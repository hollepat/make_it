package org.make_it.backend.repository

import org.make_it.backend.model.InviteCode
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for InviteCode entity operations.
 * Provides methods for invite code lookup and management.
 */
@Repository
interface InviteCodeRepository : JpaRepository<InviteCode, UUID> {

    /**
     * Find an invite code by its code string.
     *
     * @param code The invite code string
     * @return Optional containing the invite code if found
     */
    fun findByCode(code: String): Optional<InviteCode>

    /**
     * Find all invite codes created by a specific user.
     * Orders by creation date descending (newest first).
     *
     * @param userId The creator's user UUID
     * @return List of invite codes created by the user
     */
    fun findByCreatedByUserIdOrderByCreatedAtDesc(userId: UUID): List<InviteCode>

    /**
     * Check if an invite code exists with the given code string.
     *
     * @param code The invite code string to check
     * @return true if an invite code with this code exists
     */
    fun existsByCode(code: String): Boolean
}
