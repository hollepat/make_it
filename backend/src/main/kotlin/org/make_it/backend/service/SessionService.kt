package org.make_it.backend.service

import org.make_it.backend.dto.CreateSessionRequest
import org.make_it.backend.dto.UpdateSessionRequest
import org.make_it.backend.exception.ResourceNotFoundException
import org.make_it.backend.model.Session
import org.make_it.backend.repository.SessionRepository
import org.make_it.backend.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Service layer for Session-related business logic.
 * Handles creation, retrieval, updates, and completion tracking of training sessions.
 * All operations are scoped to the authenticated user.
 */
@Service
@Transactional(readOnly = true)
class SessionService(
    private val sessionRepository: SessionRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(SessionService::class.java)

    /**
     * Creates a new training session for the specified user.
     *
     * @param userId The ID of the user creating the session
     * @param request The session creation request containing all required fields
     * @return The newly created Session entity
     */
    @Transactional
    fun createSession(userId: UUID, request: CreateSessionRequest): Session {
        logger.info("Creating new session for user {} program {} on {}", userId, request.programId, request.scheduledDate)

        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val session = Session(
            user = user,
            programId = request.programId,
            type = request.type.lowercase().trim(),
            scheduledDate = request.scheduledDate,
            notes = request.notes?.trim()?.takeIf { it.isNotBlank() },
            durationMinutes = request.durationMinutes
        )

        return sessionRepository.save(session).also {
            logger.info("Created session with id {}", it.id)
        }
    }

    /**
     * Retrieves all sessions for the specified user ordered by scheduled date.
     *
     * @param userId The ID of the user
     * @return List of user's sessions
     */
    fun listSessions(userId: UUID): List<Session> {
        logger.debug("Listing all sessions for user {}", userId)
        return sessionRepository.findByUserIdOrderByScheduledDateAsc(userId)
    }

    /**
     * Retrieves a single session by its ID for the specified user.
     * Returns 404 if session doesn't exist OR doesn't belong to user (to avoid leaking existence).
     *
     * @param userId The ID of the user
     * @param id The session UUID
     * @return The Session entity
     * @throws ResourceNotFoundException if session is not found or doesn't belong to user
     */
    fun getSession(userId: UUID, id: UUID): Session {
        logger.debug("Fetching session {} for user {}", id, userId)
        val session = sessionRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Session", id) }

        // Return 404 instead of 403 to avoid leaking existence of other users' sessions
        if (session.user?.id != userId) {
            throw ResourceNotFoundException("Session", id)
        }

        return session
    }

    /**
     * Retrieves upcoming incomplete sessions for the specified user within the specified number of days.
     *
     * @param userId The ID of the user
     * @param days Number of days to look ahead (default 7)
     * @return List of upcoming incomplete sessions ordered by scheduled date
     */
    fun getUpcomingSessions(userId: UUID, days: Int = 7): List<Session> {
        val today = LocalDate.now()
        val endDate = today.plusDays(days.toLong())

        logger.debug("Fetching upcoming sessions for user {} from {} to {}", userId, today, endDate)

        return sessionRepository.findUpcomingIncompleteByUserId(userId, today, endDate)
    }

    /**
     * Toggles the completion status of a session for the specified user.
     * If the session is incomplete, marks it as complete with current timestamp.
     * If the session is complete, marks it as incomplete and clears the timestamp.
     *
     * @param userId The ID of the user
     * @param id The session UUID
     * @return The updated Session entity
     * @throws ResourceNotFoundException if session is not found or doesn't belong to user
     */
    @Transactional
    fun toggleCompletion(userId: UUID, id: UUID): Session {
        logger.info("Toggling completion for session {} by user {}", id, userId)

        val session = getSession(userId, id)
        session.toggleCompletion()

        return sessionRepository.save(session).also {
            logger.info("Session {} completion toggled to {}", id, it.completed)
        }
    }

    /**
     * Updates an existing session for the specified user with the provided fields.
     * Only non-null fields in the request will be updated.
     *
     * @param userId The ID of the user
     * @param id The session UUID
     * @param request The update request with optional fields
     * @return The updated Session entity
     * @throws ResourceNotFoundException if session is not found or doesn't belong to user
     */
    @Transactional
    fun updateSession(userId: UUID, id: UUID, request: UpdateSessionRequest): Session {
        logger.info("Updating session {} for user {}", id, userId)

        val session = getSession(userId, id)

        request.type?.let { session.type = it.lowercase().trim() }
        request.scheduledDate?.let { session.scheduledDate = it }
        request.notes?.let { session.notes = it.trim().takeIf { note -> note.isNotBlank() } }
        request.durationMinutes?.let { session.durationMinutes = it }
        if (request.clearProgramId) {
            session.programId = null
        } else {
            request.programId?.let { session.programId = it }
        }

        return sessionRepository.save(session).also {
            logger.info("Updated session {}", id)
        }
    }

    /**
     * Deletes a session for the specified user by its ID.
     *
     * @param userId The ID of the user
     * @param id The session UUID
     * @throws ResourceNotFoundException if session is not found or doesn't belong to user
     */
    @Transactional
    fun deleteSession(userId: UUID, id: UUID) {
        logger.info("Deleting session {} for user {}", id, userId)

        // This also verifies ownership
        getSession(userId, id)

        sessionRepository.deleteById(id)
        logger.info("Deleted session {}", id)
    }

    /**
     * Retrieves all sessions for a specific program belonging to the specified user.
     *
     * @param userId The ID of the user
     * @param programId The program UUID
     * @return List of sessions for the program ordered by scheduled date
     */
    fun getSessionsByProgram(userId: UUID, programId: UUID): List<Session> {
        logger.debug("Fetching sessions for program {} for user {}", programId, userId)
        // Get all sessions for the program and filter by user
        return sessionRepository.findByProgramIdOrderByScheduledDateAsc(programId)
            .filter { it.user?.id == userId }
    }
}
