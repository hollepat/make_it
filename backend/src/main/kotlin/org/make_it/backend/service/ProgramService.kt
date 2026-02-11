package org.make_it.backend.service

import org.make_it.backend.dto.CreateProgramRequest
import org.make_it.backend.dto.ProgramResponse
import org.make_it.backend.dto.UpdateProgramRequest
import org.make_it.backend.exception.ResourceNotFoundException
import org.make_it.backend.model.Program
import org.make_it.backend.repository.ProgramRepository
import org.make_it.backend.repository.SessionRepository
import org.make_it.backend.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ProgramService(
    private val programRepository: ProgramRepository,
    private val sessionRepository: SessionRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(ProgramService::class.java)

    @Transactional
    fun createProgram(userId: UUID, request: CreateProgramRequest): ProgramResponse {
        logger.info("Creating program '{}' for user {}", request.name, userId)

        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val program = Program(
            user = user,
            name = request.name.trim(),
            goal = request.goal?.trim()?.takeIf { it.isNotBlank() },
            tag = request.tag.lowercase().trim(),
            startDate = request.startDate
        )

        val saved = programRepository.save(program)
        logger.info("Created program with id {}", saved.id)
        return ProgramResponse.from(saved, 0, 0)
    }

    fun listPrograms(userId: UUID): List<ProgramResponse> {
        logger.debug("Listing programs for user {}", userId)
        return programRepository.findByUserIdOrderByCreatedAtDesc(userId).map { program ->
            val total = sessionRepository.countByProgramId(program.id)
            val completed = sessionRepository.countByProgramIdAndCompletedTrue(program.id)
            ProgramResponse.from(program, total, completed)
        }
    }

    fun getProgram(userId: UUID, id: UUID): ProgramResponse {
        logger.debug("Fetching program {} for user {}", id, userId)
        val program = programRepository.findByIdAndUserId(id, userId)
            .orElseThrow { ResourceNotFoundException("Program", id) }
        val total = sessionRepository.countByProgramId(program.id)
        val completed = sessionRepository.countByProgramIdAndCompletedTrue(program.id)
        return ProgramResponse.from(program, total, completed)
    }

    @Transactional
    fun updateProgram(userId: UUID, id: UUID, request: UpdateProgramRequest): ProgramResponse {
        logger.info("Updating program {} for user {}", id, userId)
        val program = programRepository.findByIdAndUserId(id, userId)
            .orElseThrow { ResourceNotFoundException("Program", id) }

        request.name?.let { program.name = it.trim() }
        request.goal?.let { program.goal = it.trim().takeIf { g -> g.isNotBlank() } }
        request.tag?.let { program.tag = it.lowercase().trim() }
        request.startDate?.let { program.startDate = it }

        val saved = programRepository.save(program)
        val total = sessionRepository.countByProgramId(saved.id)
        val completed = sessionRepository.countByProgramIdAndCompletedTrue(saved.id)
        logger.info("Updated program {}", id)
        return ProgramResponse.from(saved, total, completed)
    }

    @Transactional
    fun deleteProgram(userId: UUID, id: UUID) {
        logger.info("Deleting program {} for user {}", id, userId)
        programRepository.findByIdAndUserId(id, userId)
            .orElseThrow { ResourceNotFoundException("Program", id) }
        programRepository.deleteById(id)
        logger.info("Deleted program {}", id)
    }
}
