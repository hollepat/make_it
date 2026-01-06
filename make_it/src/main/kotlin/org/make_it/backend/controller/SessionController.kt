package org.make_it.backend.controller

import jakarta.validation.Valid
import org.make_it.backend.dto.CreateSessionRequest
import org.make_it.backend.dto.SessionResponse
import org.make_it.backend.dto.UpdateSessionRequest
import org.make_it.backend.service.SessionService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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
 */
@RestController
@RequestMapping("/api/sessions")
class SessionController(
    private val sessionService: SessionService
) {
    private val logger = LoggerFactory.getLogger(SessionController::class.java)

    /**
     * Creates a new training session.
     *
     * POST /api/sessions
     *
     * @param request The session creation request
     * @return The created session with HTTP 201 Created status
     */
    @PostMapping
    fun createSession(
        @Valid @RequestBody request: CreateSessionRequest
    ): ResponseEntity<SessionResponse> {
        logger.info("POST /api/sessions - Creating session for program {}", request.programId)

        val session = sessionService.createSession(request)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(SessionResponse.from(session))
    }

    /**
     * Lists all training sessions.
     *
     * GET /api/sessions
     *
     * @return List of all sessions
     */
    @GetMapping
    fun listSessions(): ResponseEntity<List<SessionResponse>> {
        logger.info("GET /api/sessions - Listing all sessions")

        val sessions = sessionService.listSessions()
            .map { SessionResponse.from(it) }

        return ResponseEntity.ok(sessions)
    }

    /**
     * Retrieves a single session by ID.
     *
     * GET /api/sessions/{id}
     *
     * @param id The session UUID
     * @return The session details
     */
    @GetMapping("/{id}")
    fun getSession(@PathVariable id: UUID): ResponseEntity<SessionResponse> {
        logger.info("GET /api/sessions/{} - Fetching session", id)

        val session = sessionService.getSession(id)
        return ResponseEntity.ok(SessionResponse.from(session))
    }

    /**
     * Retrieves upcoming incomplete sessions.
     *
     * GET /api/sessions/upcoming?days=7
     *
     * @param days Number of days to look ahead (default 7)
     * @return List of upcoming incomplete sessions
     */
    @GetMapping("/upcoming")
    fun getUpcomingSessions(
        @RequestParam(defaultValue = "7") days: Int
    ): ResponseEntity<List<SessionResponse>> {
        logger.info("GET /api/sessions/upcoming - Fetching upcoming sessions for next {} days", days)

        val sessions = sessionService.getUpcomingSessions(days)
            .map { SessionResponse.from(it) }

        return ResponseEntity.ok(sessions)
    }

    /**
     * Toggles the completion status of a session.
     *
     * PATCH /api/sessions/{id}/complete
     *
     * @param id The session UUID
     * @return The updated session with toggled completion status
     */
    @PatchMapping("/{id}/complete")
    fun toggleCompletion(@PathVariable id: UUID): ResponseEntity<SessionResponse> {
        logger.info("PATCH /api/sessions/{}/complete - Toggling completion", id)

        val session = sessionService.toggleCompletion(id)
        return ResponseEntity.ok(SessionResponse.from(session))
    }

    /**
     * Updates an existing session.
     *
     * PUT /api/sessions/{id}
     *
     * @param id The session UUID
     * @param request The update request with optional fields
     * @return The updated session
     */
    @PutMapping("/{id}")
    fun updateSession(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSessionRequest
    ): ResponseEntity<SessionResponse> {
        logger.info("PUT /api/sessions/{} - Updating session", id)

        val session = sessionService.updateSession(id, request)
        return ResponseEntity.ok(SessionResponse.from(session))
    }

    /**
     * Deletes a session.
     *
     * DELETE /api/sessions/{id}
     *
     * @param id The session UUID
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/{id}")
    fun deleteSession(@PathVariable id: UUID): ResponseEntity<Unit> {
        logger.info("DELETE /api/sessions/{} - Deleting session", id)

        sessionService.deleteSession(id)
        return ResponseEntity.noContent().build()
    }
}
