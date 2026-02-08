package org.make_it.backend.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.make_it.backend.model.InviteCode
import java.time.LocalDateTime
import java.util.UUID

/**
 * Request DTO for creating a new invite code.
 */
data class CreateInviteRequest(
    @field:Min(value = 1, message = "Expiration must be at least 1 day")
    @field:Max(value = 365, message = "Expiration must not exceed 365 days")
    val expiresInDays: Int? = null
)

/**
 * Response DTO for invite code information.
 */
data class InviteResponse(
    val id: UUID,
    val code: String,
    val expiresAt: LocalDateTime,
    val createdAt: LocalDateTime,
    val usedByEmail: String?
) {
    companion object {
        /**
         * Factory method to create InviteResponse from InviteCode entity.
         */
        fun from(inviteCode: InviteCode): InviteResponse = InviteResponse(
            id = inviteCode.id,
            code = inviteCode.code,
            expiresAt = inviteCode.expiresAt,
            createdAt = inviteCode.createdAt,
            usedByEmail = inviteCode.usedByUser?.email
        )
    }
}

/**
 * Response DTO for invite code validation.
 */
data class InviteValidationResponse(
    val valid: Boolean,
    val message: String
)
