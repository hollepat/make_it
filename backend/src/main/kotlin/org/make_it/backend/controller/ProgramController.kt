package org.make_it.backend.controller

import jakarta.validation.Valid
import org.make_it.backend.dto.CreateProgramRequest
import org.make_it.backend.dto.ProgramResponse
import org.make_it.backend.dto.SessionResponse
import org.make_it.backend.dto.UpdateProgramRequest
import org.make_it.backend.security.AuthenticatedUser
import org.make_it.backend.service.ProgramService
import org.make_it.backend.service.SessionService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/programs")
class ProgramController(
    private val programService: ProgramService,
    private val sessionService: SessionService
) {
    private val logger = LoggerFactory.getLogger(ProgramController::class.java)

    @PostMapping
    fun createProgram(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @Valid @RequestBody request: CreateProgramRequest
    ): ResponseEntity<ProgramResponse> {
        logger.info("POST /api/programs - Creating program for user {}", user.id)
        val program = programService.createProgram(user.id, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(program)
    }

    @GetMapping
    fun listPrograms(
        @AuthenticationPrincipal user: AuthenticatedUser
    ): ResponseEntity<List<ProgramResponse>> {
        logger.info("GET /api/programs - Listing programs for user {}", user.id)
        val programs = programService.listPrograms(user.id)
        return ResponseEntity.ok(programs)
    }

    @GetMapping("/{id}")
    fun getProgram(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID
    ): ResponseEntity<ProgramResponse> {
        logger.info("GET /api/programs/{} - Fetching program for user {}", id, user.id)
        val program = programService.getProgram(user.id, id)
        return ResponseEntity.ok(program)
    }

    @PutMapping("/{id}")
    fun updateProgram(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateProgramRequest
    ): ResponseEntity<ProgramResponse> {
        logger.info("PUT /api/programs/{} - Updating program for user {}", id, user.id)
        val program = programService.updateProgram(user.id, id, request)
        return ResponseEntity.ok(program)
    }

    @DeleteMapping("/{id}")
    fun deleteProgram(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID
    ): ResponseEntity<Unit> {
        logger.info("DELETE /api/programs/{} - Deleting program for user {}", id, user.id)
        programService.deleteProgram(user.id, id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}/sessions")
    fun getProgramSessions(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID
    ): ResponseEntity<List<SessionResponse>> {
        logger.info("GET /api/programs/{}/sessions - Fetching sessions for user {}", id, user.id)
        // Verify program ownership
        programService.getProgram(user.id, id)
        val sessions = sessionService.getSessionsByProgram(user.id, id)
            .map { SessionResponse.from(it) }
        return ResponseEntity.ok(sessions)
    }
}
