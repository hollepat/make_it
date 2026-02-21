package org.make_it.backend.service

import dev.langchain4j.agent.tool.Tool
import org.make_it.backend.dto.CreateSessionRequest
import org.make_it.backend.dto.UpdateAthleteProfileRequest
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
    private val programService: ProgramService,
    private val athleteProfileService: AthleteProfileService
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

    @Tool("Get the athlete's profile summary including age, fitness level, injury notes, and training availability")
    fun getAthleteProfile(): String {
        val userId = UserContext.get()
        val profile = athleteProfileService.findByUserId(userId)
            ?: return "No athlete profile found. Consider asking the user to fill in their profile at /profile."

        val lines = mutableListOf<String>()
        profile.age?.let { lines += "Age: $it" }
        profile.fitnessLevel?.let { lines += "Fitness level: $it" }
        profile.primarySport?.let { lines += "Primary sport: $it" }
        profile.trainingAgeYears?.let { lines += "Training age: $it years" }
        profile.weightKg?.let { lines += "Weight: ${it}kg" }
        profile.heightCm?.let { lines += "Height: ${it}cm" }
        profile.maxHeartRate?.let { lines += "Max HR: ${it} bpm" }
            ?: profile.age?.let { lines += "Estimated max HR: ${220 - it} bpm (220 - age)" }
        profile.restingHeartRate?.let { lines += "Resting HR: ${it} bpm" }
        profile.weeklyAvailabilityHours?.let { lines += "Weekly availability: ${it}h" }
        profile.injuryNotes?.let { lines += "Injury notes: $it" }
        profile.goals?.let { lines += "Goals: $it" }

        return if (lines.isEmpty()) "Athlete profile exists but no details have been filled in yet."
        else lines.joinToString("\n")
    }

    @Tool(
        "Update the athlete's profile. Only non-null parameters will be applied. " +
        "fitnessLevel must be one of: beginner, intermediate, advanced, elite."
    )
    fun updateAthleteProfile(
        age: Int? = null,
        fitnessLevel: String? = null,
        primarySport: String? = null,
        trainingAgeYears: Int? = null,
        maxHeartRate: Int? = null,
        restingHeartRate: Int? = null,
        injuryNotes: String? = null,
        weeklyAvailabilityHours: Int? = null,
        goals: String? = null
    ): String {
        val userId = UserContext.get()
        val request = UpdateAthleteProfileRequest(
            age = age,
            fitnessLevel = fitnessLevel,
            primarySport = primarySport,
            trainingAgeYears = trainingAgeYears,
            maxHeartRate = maxHeartRate,
            restingHeartRate = restingHeartRate,
            injuryNotes = injuryNotes,
            weeklyAvailabilityHours = weeklyAvailabilityHours,
            goals = goals
        )
        athleteProfileService.update(userId, request)
        return "Athlete profile updated successfully."
    }

    @Tool(
        "Analyse the user's training history for the past N days. " +
        "Returns total sessions, hours trained, completion rate, sport breakdown, " +
        "and the acute:chronic workload ratio (ACWR). " +
        "ACWR > 1.5 signals overtraining risk; ACWR < 0.8 signals detraining."
    )
    fun analyzeTrainingHistory(days: Int = 30): String {
        val userId = UserContext.get()
        val today = LocalDate.now()
        val windowStart = today.minusDays(days.toLong())
        val acwrStart = today.minusDays(28)

        val allSessions = sessionService.listSessions(userId)

        val windowSessions = allSessions.filter { !it.scheduledDate.isBefore(windowStart) }
        val totalInWindow = windowSessions.size
        val completedInWindow = windowSessions.count { it.completed }
        val completionRate = if (totalInWindow > 0)
            (completedInWindow * 100.0 / totalInWindow).toInt() else 0

        val hoursInWindow = windowSessions
            .filter { it.completed }
            .sumOf { it.durationMinutes ?: 0 } / 60.0

        val sportBreakdown = windowSessions
            .groupBy { it.type }
            .map { (type, sessions) ->
                val done = sessions.count { it.completed }
                "$type: $done/${sessions.size}"
            }
            .joinToString(", ")

        // ACWR: acute (last 7 days) / chronic (avg weekly over last 28 days)
        val acuteSessions = allSessions.filter {
            !it.scheduledDate.isBefore(today.minusDays(7)) && it.completed
        }
        val acuteHours = acuteSessions.sumOf { it.durationMinutes ?: 0 } / 60.0

        val chronicSessions = allSessions.filter {
            !it.scheduledDate.isBefore(acwrStart) && it.completed
        }
        val chronicHoursPerWeek = chronicSessions.sumOf { it.durationMinutes ?: 0 } / 60.0 / 4.0

        val acwr = if (chronicHoursPerWeek > 0)
            String.format("%.2f", acuteHours / chronicHoursPerWeek)
        else "N/A (insufficient history)"

        return buildString {
            appendLine("Training analysis for past $days days:")
            appendLine("- Total sessions: $totalInWindow ($completedInWindow completed, $completionRate% completion rate)")
            appendLine("- Hours trained: ${"%.1f".format(hoursInWindow)}h")
            if (sportBreakdown.isNotBlank()) appendLine("- By sport: $sportBreakdown")
            appendLine("- Acute load (last 7d): ${"%.1f".format(acuteHours)}h")
            appendLine("- Chronic load (avg/week over 28d): ${"%.1f".format(chronicHoursPerWeek)}h")
            append("- ACWR: $acwr")
        }
    }
}
