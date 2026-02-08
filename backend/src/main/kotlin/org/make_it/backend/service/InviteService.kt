package org.make_it.backend.service

import org.make_it.backend.config.InviteProperties
import org.make_it.backend.dto.CreateInviteRequest
import org.make_it.backend.dto.InviteResponse
import org.make_it.backend.dto.InviteValidationResponse
import org.make_it.backend.model.InviteCode
import org.make_it.backend.repository.InviteCodeRepository
import org.make_it.backend.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.LocalDateTime
import java.util.UUID

/**
 * Service for managing invite codes.
 * Handles creation, listing, and validation of invite codes.
 */
@Service
@Transactional(readOnly = true)
class InviteService(
    private val inviteCodeRepository: InviteCodeRepository,
    private val userRepository: UserRepository,
    private val inviteProperties: InviteProperties
) {
    private val logger = LoggerFactory.getLogger(InviteService::class.java)
    private val secureRandom = SecureRandom()

    companion object {
        // Characters for generating invite codes (excluding ambiguous characters like 0/O, 1/l/I)
        private const val CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        private const val CODE_LENGTH = 8
    }

    /**
     * Creates a new invite code for the given user.
     *
     * @param userId The ID of the user creating the invite
     * @param request Optional request with custom expiration
     * @return InviteResponse with the created invite code details
     */
    @Transactional
    fun createInvite(userId: UUID, request: CreateInviteRequest?): InviteResponse {
        logger.info("Creating invite code for user: {}", userId)

        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val expirationDays = request?.expiresInDays ?: inviteProperties.codeExpirationDays
        val expiresAt = LocalDateTime.now().plusDays(expirationDays.toLong())

        val code = generateUniqueCode()

        val inviteCode = InviteCode(
            code = code,
            createdByUser = user,
            expiresAt = expiresAt
        )

        val savedInvite = inviteCodeRepository.save(inviteCode)
        logger.info("Created invite code {} for user {}", code, userId)

        return InviteResponse.from(savedInvite)
    }

    /**
     * Lists all invite codes created by the given user.
     *
     * @param userId The ID of the user
     * @return List of InviteResponse with all invite codes created by the user
     */
    fun listUserInvites(userId: UUID): List<InviteResponse> {
        logger.debug("Listing invite codes for user: {}", userId)

        return inviteCodeRepository.findByCreatedByUserIdOrderByCreatedAtDesc(userId)
            .map { InviteResponse.from(it) }
    }

    /**
     * Validates an invite code and returns validation result.
     * This is a public endpoint for checking code validity before registration.
     *
     * @param code The invite code to validate
     * @return InviteValidationResponse indicating if the code is valid
     */
    fun validateInviteCode(code: String): InviteValidationResponse {
        val trimmedCode = code.trim()

        logger.debug("Validating invite code: {}", trimmedCode)

        // Check if it's the bootstrap code
        if (inviteProperties.bootstrapCode.isNotBlank() && trimmedCode == inviteProperties.bootstrapCode) {
            return InviteValidationResponse(
                valid = true,
                message = "Valid invite code"
            )
        }

        // Check the database
        val inviteCode = inviteCodeRepository.findByCode(trimmedCode).orElse(null)

        return when {
            inviteCode == null -> InviteValidationResponse(
                valid = false,
                message = "Invalid invite code"
            )
            inviteCode.isExpired() -> InviteValidationResponse(
                valid = false,
                message = "Invite code has expired"
            )
            inviteCode.isUsed() -> InviteValidationResponse(
                valid = false,
                message = "Invite code has already been used"
            )
            else -> InviteValidationResponse(
                valid = true,
                message = "Valid invite code"
            )
        }
    }

    /**
     * Generates a unique random invite code.
     */
    private fun generateUniqueCode(): String {
        var code: String
        var attempts = 0
        val maxAttempts = 10

        do {
            code = generateRandomCode()
            attempts++
        } while (inviteCodeRepository.existsByCode(code) && attempts < maxAttempts)

        if (attempts >= maxAttempts) {
            throw IllegalStateException("Failed to generate unique invite code after $maxAttempts attempts")
        }

        return code
    }

    /**
     * Generates a random code string.
     */
    private fun generateRandomCode(): String {
        return (1..CODE_LENGTH)
            .map { CODE_CHARACTERS[secureRandom.nextInt(CODE_CHARACTERS.length)] }
            .joinToString("")
    }
}
