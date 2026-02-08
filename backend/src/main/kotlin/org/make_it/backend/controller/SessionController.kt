package org.make_it.backend.controller

import jakarta.validation.Valid
import org.make_it.backend.dto.CreateSessionRequest
import org.make_it.backend.dto.SessionResponse
import org.make_it.backend.dto.UpdateSessionRequest
import org.make_it.backend.security.AuthenticatedUser
import org.make_it.backend.service.SessionService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * REST controller for Session operations.
 * Provides CRUD endpoints for managing training sessions.
 * All operations are scoped to the authenticated user.
 */
@RestController
@RequestMapping("/api/sessions")
class SessionController(
    private val sessionService: SessionService
) {
    private val logger = LoggerFactory.getLogger(SessionController::class.java)

    /**
     * Creates a new training session for the authenticated user.
     *
     * POST /api/sessions
     *
     * @param user The authenticated user
     * @param request The session creation request
     * @return The created session with HTTP 201 Created status
     */
    @PostMapping
    fun createSession(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @Valid @RequestBody request: CreateSessionRequest
    ): ResponseEntity<SessionResponse> {
        logger.info("POST /api/sessions - Creating session for user {} program {}", user.id, request.programId)

        val session = sessionService.createSession(user.id, request)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(SessionResponse.from(session))
    }

    /**
     * Lists all training sessions for the authenticated user.
     *
     * GET /api/sessions
     *
     * @param user The authenticated user
     * @return List of user's sessions
     */
    @GetMapping
    fun listSessions(
        @AuthenticationPrincipal user: AuthenticatedUser
    ): ResponseEntity<List<SessionResponse>> {
        logger.info("GET /api/sessions - Listing all sessions for user {}", user.id)

        val sessions = sessionService.listSessions(user.id)
            .map { SessionResponse.from(it) }

        return ResponseEntity.ok(sessions)
    }

    /**
     * Retrieves a single session by ID for the authenticated user.
     *
     * GET /api/sessions/{id}
     *
     * @param user The authenticated user
     * @param id The session UUID
     * @return The session details
     */
    @GetMapping("/{id}")
    fun getSession(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID
    ): ResponseEntity<SessionResponse> {
        logger.info("GET /api/sessions/{} - Fetching session for user {}", id, user.id)

        val session = sessionService.getSession(user.id, id)
        return ResponseEntity.ok(SessionResponse.from(session))
    }

    /**
     * Retrieves upcoming incomplete sessions for the authenticated user.
     *
     * GET /api/sessions/upcoming?days=7
     *
     * @param user The authenticated user
     * @param days Number of days to look ahead (default 7)
     * @return List of upcoming incomplete sessions
     */
    @GetMapping("/upcoming")
    fun getUpcomingSessions(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestParam(defaultValue = "7") days: Int
    ): ResponseEntity<List<SessionResponse>> {
        logger.info("GET /api/sessions/upcoming - Fetching upcoming sessions for user {} for next {} days", user.id, days)

        val sessions = sessionService.getUpcomingSessions(user.id, days)
            .map { SessionResponse.from(it) }

        return ResponseEntity.ok(sessions)
    }

    /**
     * Toggles the completion status of a session for the authenticated user.
     *
     * PATCH /api/sessions/{id}/complete
     *
     * @param user The authenticated user
     * @param id The session UUID
     * @return The updated session with toggled completion status
     */
    @PatchMapping("/{id}/complete")
    fun toggleCompletion(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID
    ): ResponseEntity<SessionResponse> {
        logger.info("PATCH /api/sessions/{}/complete - Toggling completion for user {}", id, user.id)

        val session = sessionService.toggleCompletion(user.id, id)
        return ResponseEntity.ok(SessionResponse.from(session))
    }

    /**
     * Updates an existing session for the authenticated user.
     *
     * PUT /api/sessions/{id}
     *
     * @param user The authenticated user
     * @param id The session UUID
     * @param request The update request with optional fields
     * @return The updated session
     */
    @PutMapping("/{id}")
    fun updateSession(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSessionRequest
    ): ResponseEntity<SessionResponse> {
        logger.info("PUT /api/sessions/{} - Updating session for user {}", id, user.id)

        val session = sessionService.updateSession(user.id, id, request)
        return ResponseEntity.ok(SessionResponse.from(session))
    }

    /**
     * Deletes a session for the authenticated user.
     *
     * DELETE /api/sessions/{id}
     *
     * @param user The authenticated user
     * @param id The session UUID
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/{id}")
    fun deleteSession(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID
    ): ResponseEntity<Unit> {
        logger.info("DELETE /api/sessions/{} - Deleting session for user {}", id, user.id)

        sessionService.deleteSession(user.id, id)
        return ResponseEntity.noContent().build()
    }
}
