package org.make_it.backend.controller

import jakarta.validation.Valid
import org.make_it.backend.dto.CreateInviteRequest
import org.make_it.backend.dto.InviteResponse
import org.make_it.backend.dto.InviteValidationResponse
import org.make_it.backend.security.AuthenticatedUser
import org.make_it.backend.service.InviteService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * REST controller for invite code operations.
 * Provides endpoints for creating, listing, and validating invite codes.
 */
@RestController
@RequestMapping("/api/invites")
class InviteController(
    private val inviteService: InviteService
) {
    private val logger = LoggerFactory.getLogger(InviteController::class.java)

    /**
     * Creates a new invite code for the authenticated user.
     *
     * POST /api/invites
     *
     * @param user The authenticated user (from JWT token)
     * @param request Optional request with custom expiration days
     * @return InviteResponse with the created invite code details
     */
    @PostMapping
    fun createInvite(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @Valid @RequestBody(required = false) request: CreateInviteRequest?
    ): ResponseEntity<InviteResponse> {
        logger.info("POST /api/invites - Creating invite for user: {}", user.id)

        val response = inviteService.createInvite(user.id, request)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response)
    }

    /**
     * Lists all invite codes created by the authenticated user.
     *
     * GET /api/invites
     *
     * @param user The authenticated user (from JWT token)
     * @return List of InviteResponse with all invite codes
     */
    @GetMapping
    fun listInvites(
        @AuthenticationPrincipal user: AuthenticatedUser
    ): ResponseEntity<List<InviteResponse>> {
        logger.info("GET /api/invites - Listing invites for user: {}", user.id)

        val response = inviteService.listUserInvites(user.id)
        return ResponseEntity.ok(response)
    }

    /**
     * Validates an invite code (public endpoint).
     * Used to check if a code is valid before attempting registration.
     *
     * GET /api/invites/{code}/validate
     *
     * @param code The invite code to validate
     * @return InviteValidationResponse indicating if the code is valid
     */
    @GetMapping("/{code}/validate")
    fun validateInvite(
        @PathVariable code: String
    ): ResponseEntity<InviteValidationResponse> {
        logger.info("GET /api/invites/{}/validate - Validating invite code", code)

        val response = inviteService.validateInviteCode(code)
        return ResponseEntity.ok(response)
    }
}
