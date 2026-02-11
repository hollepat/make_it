package org.make_it.backend.repository

import org.make_it.backend.model.Program
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
interface ProgramRepository : JpaRepository<Program, UUID> {

    fun findByUserIdOrderByCreatedAtDesc(userId: UUID): List<Program>

    fun findByIdAndUserId(id: UUID, userId: UUID): Optional<Program>
}
