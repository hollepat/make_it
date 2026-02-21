package org.make_it.backend.service

import org.make_it.backend.dto.AthleteProfileResponse
import org.make_it.backend.dto.UpdateAthleteProfileRequest
import org.make_it.backend.model.UserAthleteProfile
import org.make_it.backend.repository.UserAthleteProfileRepository
import org.make_it.backend.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AthleteProfileService(
    private val profileRepository: UserAthleteProfileRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(AthleteProfileService::class.java)

    /**
     * Returns the athlete profile for the given user, creating an empty one if it
     * does not yet exist.
     */
    @Transactional
    fun getOrCreate(userId: UUID): AthleteProfileResponse {
        val profile = profileRepository.findByUserId(userId) ?: createEmpty(userId)
        return AthleteProfileResponse.from(profile)
    }

    /**
     * Applies only the non-null fields from the request to the profile, then saves.
     */
    @Transactional
    fun update(userId: UUID, request: UpdateAthleteProfileRequest): AthleteProfileResponse {
        logger.info("Updating athlete profile for user {}", userId)
        val profile = profileRepository.findByUserId(userId) ?: createEmpty(userId)

        request.age?.let { profile.age = it }
        request.weightKg?.let { profile.weightKg = it }
        request.heightCm?.let { profile.heightCm = it }
        request.fitnessLevel?.let { profile.fitnessLevel = it.lowercase().trim() }
        request.primarySport?.let { profile.primarySport = it.trim() }
        request.trainingAgeYears?.let { profile.trainingAgeYears = it }
        request.maxHeartRate?.let { profile.maxHeartRate = it }
        request.restingHeartRate?.let { profile.restingHeartRate = it }
        request.injuryNotes?.let { profile.injuryNotes = it.trim().takeIf { n -> n.isNotBlank() } }
        request.weeklyAvailabilityHours?.let { profile.weeklyAvailabilityHours = it }
        request.goals?.let { profile.goals = it.trim().takeIf { g -> g.isNotBlank() } }
        profile.updatedAt = LocalDateTime.now()

        val saved = profileRepository.save(profile)
        logger.info("Updated athlete profile {} for user {}", saved.id, userId)
        return AthleteProfileResponse.from(saved)
    }

    /** Loads the raw entity for use inside LangChain4j tools (avoids re-mapping). */
    fun findByUserId(userId: UUID): UserAthleteProfile? =
        profileRepository.findByUserId(userId)

    private fun createEmpty(userId: UUID): UserAthleteProfile {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found: $userId") }
        val profile = UserAthleteProfile(user = user)
        return profileRepository.save(profile)
    }
}
