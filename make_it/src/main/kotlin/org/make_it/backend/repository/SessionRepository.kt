package org.make_it.backend.repository

import org.make_it.backend.model.Session
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.UUID

/**
 * Repository interface for Session entity operations.
 * Extends JpaRepository to provide standard CRUD operations plus custom queries.
 */
@Repository
interface SessionRepository : JpaRepository<Session, UUID> {

    /**
     * Find all sessions for a specific program.
     */
    fun findByProgramIdOrderByScheduledDateAsc(programId: UUID): List<Session>

    /**
     * Find sessions scheduled between two dates (inclusive).
     * Useful for calendar views and upcoming sessions.
     */
    fun findByScheduledDateBetweenOrderByScheduledDateAsc(
        startDate: LocalDate,
        endDate: LocalDate
    ): List<Session>

    /**
     * Find upcoming sessions from today up to a given end date.
     * Only returns incomplete sessions.
     */
    @Query("""
        SELECT s FROM Session s
        WHERE s.scheduledDate >= :startDate
        AND s.scheduledDate <= :endDate
        AND s.completed = false
        ORDER BY s.scheduledDate ASC
    """)
    fun findUpcomingIncomplete(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<Session>

    /**
     * Find all sessions for a specific program and date range.
     */
    fun findByProgramIdAndScheduledDateBetweenOrderByScheduledDateAsc(
        programId: UUID,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<Session>

    /**
     * Count completed sessions for a program.
     */
    fun countByProgramIdAndCompletedTrue(programId: UUID): Long

    /**
     * Count total sessions for a program.
     */
    fun countByProgramId(programId: UUID): Long
}
