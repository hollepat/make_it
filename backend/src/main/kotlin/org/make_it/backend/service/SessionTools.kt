package org.make_it.backend.service

import dev.langchain4j.agent.tool.Tool
import org.make_it.backend.dto.CreateSessionRequest
import org.make_it.backend.dto.UpdateSessionRequest
import org.springframework.stereotype.Component
import java.time.LocalDate
import java.util.UUID

/**
 * ThreadLocal holder for the current user's ID.
 * Set by the controller before calling the AI assistant,
 * cleared in a finally block after the call completes.
 */
object UserContext {
    private val userId = ThreadLocal<UUID>()

    fun set(id: UUID) = userId.set(id)
    fun get(): UUID = userId.get() ?: throw IllegalStateException("UserContext not set")
    fun clear() = userId.remove()
}

/**
 * Tool methods exposed to the LLM via LangChain4j.
 * Each method delegates to existing service layer with proper user scoping.
 * All parameters are String/primitives since LangChain4j parses them from LLM output.
 */
@Component
class SessionTools(
    private val sessionService: SessionService,
    private val programService: ProgramService
) {

    @Tool("Get all training sessions for the user")
    fun listAllSessions(): String {
        val userId = UserContext.get()
        val sessions = sessionService.listSessions(userId)
        if (sessions.isEmpty()) return "No sessions found."
        return sessions.joinToString("\n") { s ->
            "- ${s.type} on ${s.scheduledDate}" +
                (if (s.completed) " (completed)" else " (upcoming)") +
                (s.durationMinutes?.let { " | ${it}min" } ?: "") +
                (s.notes?.let { " | Notes: $it" } ?: "") +
                " [id: ${s.id}]"
        }
    }

    @Tool("Get upcoming incomplete sessions within the specified number of days from today")
    fun getUpcomingSessions(days: Int = 7): String {
        val userId = UserContext.get()
        val sessions = sessionService.getUpcomingSessions(userId, days)
        if (sessions.isEmpty()) return "No upcoming sessions in the next $days days."
        return sessions.joinToString("\n") { s ->
            "- ${s.type} on ${s.scheduledDate}" +
                (s.durationMinutes?.let { " | ${it}min" } ?: "") +
                (s.notes?.let { " | Notes: $it" } ?: "") +
                " [id: ${s.id}]"
        }
    }

    @Tool("Create a new training session. Type must be one of: run, boulder, gym, swim, bike, other. Date format: YYYY-MM-DD")
    fun createSession(
        type: String,
        scheduledDate: String,
        notes: String? = null,
        durationMinutes: Int? = null,
        programId: String? = null
    ): String {
        val userId = UserContext.get()
        val request = CreateSessionRequest(
            type = type,
            scheduledDate = LocalDate.parse(scheduledDate),
            notes = notes,
            durationMinutes = durationMinutes,
            programId = programId?.let { UUID.fromString(it) }
        )
        val session = sessionService.createSession(userId, request)
        return "Created ${session.type} session on ${session.scheduledDate} [id: ${session.id}]"
    }

    @Tool("Update an existing training session by its ID. Only provide fields you want to change.")
    fun updateSession(
        sessionId: String,
        type: String? = null,
        scheduledDate: String? = null,
        notes: String? = null,
        durationMinutes: Int? = null
    ): String {
        val userId = UserContext.get()
        val request = UpdateSessionRequest(
            type = type,
            scheduledDate = scheduledDate?.let { LocalDate.parse(it) },
            notes = notes,
            durationMinutes = durationMinutes
        )
        val session = sessionService.updateSession(userId, UUID.fromString(sessionId), request)
        return "Updated session: ${session.type} on ${session.scheduledDate} [id: ${session.id}]"
    }

    @Tool("Delete a training session by its ID")
    fun deleteSession(sessionId: String): String {
        val userId = UserContext.get()
        sessionService.deleteSession(userId, UUID.fromString(sessionId))
        return "Deleted session $sessionId"
    }

    @Tool("Toggle a session's completion status (mark complete or incomplete)")
    fun toggleSessionCompletion(sessionId: String): String {
        val userId = UserContext.get()
        val session = sessionService.toggleCompletion(userId, UUID.fromString(sessionId))
        val status = if (session.completed) "complete" else "incomplete"
        return "Session ${session.type} on ${session.scheduledDate} marked as $status"
    }

    @Tool("Get today's date for planning purposes. Returns date in YYYY-MM-DD format.")
    fun getTodaysDate(): String {
        return LocalDate.now().toString()
    }

    @Tool("List all training programs for the user with their session counts")
    fun listPrograms(): String {
        val userId = UserContext.get()
        val programs = programService.listPrograms(userId)
        if (programs.isEmpty()) return "No programs found."
        return programs.joinToString("\n") { p ->
            "- ${p.name} (${p.tag}) | ${p.completedSessions}/${p.totalSessions} sessions" +
                (p.goal?.let { " | Goal: $it" } ?: "") +
                " [id: ${p.id}]"
        }
    }
}
