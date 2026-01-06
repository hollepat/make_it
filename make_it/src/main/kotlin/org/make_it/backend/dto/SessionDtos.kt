package org.make_it.backend.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import org.make_it.backend.model.Session
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

/**
 * Request DTO for creating a new session.
 */
data class CreateSessionRequest(
    @field:NotNull(message = "Program ID is required")
    val programId: UUID,

    @field:NotBlank(message = "Session type is required")
    @field:Size(max = 50, message = "Session type must not exceed 50 characters")
    val type: String,

    @field:NotNull(message = "Scheduled date is required")
    val scheduledDate: LocalDate,

    @field:Size(max = 5000, message = "Notes must not exceed 5000 characters")
    val notes: String? = null,

    @field:Positive(message = "Duration must be positive")
    val durationMinutes: Int? = null
)

/**
 * Request DTO for updating an existing session.
 */
data class UpdateSessionRequest(
    @field:Size(max = 50, message = "Session type must not exceed 50 characters")
    val type: String? = null,

    val scheduledDate: LocalDate? = null,

    @field:Size(max = 5000, message = "Notes must not exceed 5000 characters")
    val notes: String? = null,

    @field:Positive(message = "Duration must be positive")
    val durationMinutes: Int? = null
)

/**
 * Response DTO for session data.
 * Separates the API contract from the internal entity structure.
 */
data class SessionResponse(
    val id: UUID,
    val programId: UUID,
    val type: String,
    val scheduledDate: LocalDate,
    val completed: Boolean,
    val completedAt: LocalDateTime?,
    val notes: String?,
    val durationMinutes: Int?,
    val createdAt: LocalDateTime
) {
    companion object {
        /**
         * Factory method to create SessionResponse from Session entity.
         */
        fun from(session: Session): SessionResponse = SessionResponse(
            id = session.id,
            programId = session.programId,
            type = session.type,
            scheduledDate = session.scheduledDate,
            completed = session.completed,
            completedAt = session.completedAt,
            notes = session.notes,
            durationMinutes = session.durationMinutes,
            createdAt = session.createdAt
        )
    }
}

/**
 * Standard API error response structure.
 */
data class ErrorResponse(
    val status: Int,
    val error: String,
    val message: String,
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val path: String? = null,
    val details: List<FieldError>? = null
)

/**
 * Field-level validation error details.
 */
data class FieldError(
    val field: String,
    val message: String,
    val rejectedValue: Any? = null
)
