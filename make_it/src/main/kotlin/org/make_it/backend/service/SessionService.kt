package org.make_it.backend.service

import org.make_it.backend.dto.CreateSessionRequest
import org.make_it.backend.dto.UpdateSessionRequest
import org.make_it.backend.exception.ResourceNotFoundException
import org.make_it.backend.model.Session
import org.make_it.backend.repository.SessionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Service layer for Session-related business logic.
 * Handles creation, retrieval, updates, and completion tracking of training sessions.
 */
@Service
@Transactional(readOnly = true)
class SessionService(
    private val sessionRepository: SessionRepository
) {
    private val logger = LoggerFactory.getLogger(SessionService::class.java)

    /**
     * Creates a new training session.
     *
     * @param request The session creation request containing all required fields
     * @return The newly created Session entity
     */
    @Transactional
    fun createSession(request: CreateSessionRequest): Session {
        logger.info("Creating new session for program {} on {}", request.programId, request.scheduledDate)

        val session = Session(
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
     * Retrieves all sessions ordered by scheduled date.
     *
     * @return List of all sessions
     */
    fun listSessions(): List<Session> {
        logger.debug("Listing all sessions")
        return sessionRepository.findAll().sortedBy { it.scheduledDate }
    }

    /**
     * Retrieves a single session by its ID.
     *
     * @param id The session UUID
     * @return The Session entity
     * @throws ResourceNotFoundException if session is not found
     */
    fun getSession(id: UUID): Session {
        logger.debug("Fetching session with id {}", id)
        return sessionRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Session", id) }
    }

    /**
     * Retrieves upcoming incomplete sessions within the specified number of days.
     *
     * @param days Number of days to look ahead (default 7)
     * @return List of upcoming incomplete sessions ordered by scheduled date
     */
    fun getUpcomingSessions(days: Int = 7): List<Session> {
        val today = LocalDate.now()
        val endDate = today.plusDays(days.toLong())

        logger.debug("Fetching upcoming sessions from {} to {}", today, endDate)

        return sessionRepository.findUpcomingIncomplete(today, endDate)
    }

    /**
     * Toggles the completion status of a session.
     * If the session is incomplete, marks it as complete with current timestamp.
     * If the session is complete, marks it as incomplete and clears the timestamp.
     *
     * @param id The session UUID
     * @return The updated Session entity
     * @throws ResourceNotFoundException if session is not found
     */
    @Transactional
    fun toggleCompletion(id: UUID): Session {
        logger.info("Toggling completion for session {}", id)

        val session = getSession(id)
        session.toggleCompletion()

        return sessionRepository.save(session).also {
            logger.info("Session {} completion toggled to {}", id, it.completed)
        }
    }

    /**
     * Updates an existing session with the provided fields.
     * Only non-null fields in the request will be updated.
     *
     * @param id The session UUID
     * @param request The update request with optional fields
     * @return The updated Session entity
     * @throws ResourceNotFoundException if session is not found
     */
    @Transactional
    fun updateSession(id: UUID, request: UpdateSessionRequest): Session {
        logger.info("Updating session {}", id)

        val session = getSession(id)

        request.type?.let { session.type = it.lowercase().trim() }
        request.scheduledDate?.let { session.scheduledDate = it }
        request.notes?.let { session.notes = it.trim().takeIf { note -> note.isNotBlank() } }
        request.durationMinutes?.let { session.durationMinutes = it }

        return sessionRepository.save(session).also {
            logger.info("Updated session {}", id)
        }
    }

    /**
     * Deletes a session by its ID.
     *
     * @param id The session UUID
     * @throws ResourceNotFoundException if session is not found
     */
    @Transactional
    fun deleteSession(id: UUID) {
        logger.info("Deleting session {}", id)

        if (!sessionRepository.existsById(id)) {
            throw ResourceNotFoundException("Session", id)
        }

        sessionRepository.deleteById(id)
        logger.info("Deleted session {}", id)
    }

    /**
     * Retrieves all sessions for a specific program.
     *
     * @param programId The program UUID
     * @return List of sessions for the program ordered by scheduled date
     */
    fun getSessionsByProgram(programId: UUID): List<Session> {
        logger.debug("Fetching sessions for program {}", programId)
        return sessionRepository.findByProgramIdOrderByScheduledDateAsc(programId)
    }
}
