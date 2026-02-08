package org.make_it.backend.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

/**
 * Entity representing a training session.
 * Sessions can be standalone or optionally associated with a program.
 * Sessions can be of various types (run, boulder, gym, etc.) and can be
 * scheduled for a specific date with optional completion tracking.
 */
@Entity
@Table(name = "sessions")
class Session(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    var user: User? = null,

    @Column(name = "program_id", nullable = true)
    val programId: UUID? = null,

    @Column(nullable = false, length = 50)
    var type: String,

    @Column(name = "scheduled_date", nullable = false)
    var scheduledDate: LocalDate,

    @Column(nullable = false)
    var completed: Boolean = false,

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null,

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "duration_minutes")
    var durationMinutes: Int? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    /**
     * Toggles the completion status of the session.
     * When marking as complete, sets completedAt to current time.
     * When marking as incomplete, clears completedAt.
     */
    fun toggleCompletion() {
        completed = !completed
        completedAt = if (completed) LocalDateTime.now() else null
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Session) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()

    override fun toString(): String {
        return "Session(id=$id, userId=${user?.id}, programId=$programId, type='$type', scheduledDate=$scheduledDate, completed=$completed)"
    }
}
