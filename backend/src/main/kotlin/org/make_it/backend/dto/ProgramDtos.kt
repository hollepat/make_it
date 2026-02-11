package org.make_it.backend.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.make_it.backend.model.Program
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

data class CreateProgramRequest(
    @field:NotBlank(message = "Program name is required")
    @field:Size(max = 255, message = "Program name must not exceed 255 characters")
    val name: String,

    @field:Size(max = 5000, message = "Goal must not exceed 5000 characters")
    val goal: String? = null,

    @field:NotBlank(message = "Tag is required")
    @field:Size(max = 50, message = "Tag must not exceed 50 characters")
    val tag: String,

    @field:NotNull(message = "Start date is required")
    val startDate: LocalDate
)

data class UpdateProgramRequest(
    @field:Size(max = 255, message = "Program name must not exceed 255 characters")
    val name: String? = null,

    @field:Size(max = 5000, message = "Goal must not exceed 5000 characters")
    val goal: String? = null,

    @field:Size(max = 50, message = "Tag must not exceed 50 characters")
    val tag: String? = null,

    val startDate: LocalDate? = null
)

data class ProgramResponse(
    val id: UUID,
    val name: String,
    val goal: String?,
    val tag: String,
    val startDate: LocalDate,
    val totalSessions: Long,
    val completedSessions: Long,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(program: Program, totalSessions: Long, completedSessions: Long): ProgramResponse = ProgramResponse(
            id = program.id,
            name = program.name,
            goal = program.goal,
            tag = program.tag,
            startDate = program.startDate,
            totalSessions = totalSessions,
            completedSessions = completedSessions,
            createdAt = program.createdAt
        )
    }
}
