package org.make_it.backend.repository

import org.make_it.backend.model.UserAthleteProfile
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface UserAthleteProfileRepository : JpaRepository<UserAthleteProfile, UUID> {

    fun findByUserId(userId: UUID): UserAthleteProfile?
}
