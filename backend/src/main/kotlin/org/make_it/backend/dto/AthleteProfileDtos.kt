package org.make_it.backend.dto

import org.make_it.backend.model.UserAthleteProfile
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.UUID

data class AthleteProfileResponse(
    val id: UUID,
    val userId: UUID,
    val age: Int?,
    val weightKg: BigDecimal?,
    val heightCm: BigDecimal?,
    val fitnessLevel: String?,
    val primarySport: String?,
    val trainingAgeYears: Int?,
    val maxHeartRate: Int?,
    val restingHeartRate: Int?,
    val injuryNotes: String?,
    val weeklyAvailabilityHours: Int?,
    val goals: String?,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun from(profile: UserAthleteProfile) = AthleteProfileResponse(
            id = profile.id,
            userId = profile.user.id,
            age = profile.age,
            weightKg = profile.weightKg,
            heightCm = profile.heightCm,
            fitnessLevel = profile.fitnessLevel,
            primarySport = profile.primarySport,
            trainingAgeYears = profile.trainingAgeYears,
            maxHeartRate = profile.maxHeartRate,
            restingHeartRate = profile.restingHeartRate,
            injuryNotes = profile.injuryNotes,
            weeklyAvailabilityHours = profile.weeklyAvailabilityHours,
            goals = profile.goals,
            updatedAt = profile.updatedAt
        )
    }
}

data class UpdateAthleteProfileRequest(
    val age: Int? = null,
    val weightKg: BigDecimal? = null,
    val heightCm: BigDecimal? = null,
    val fitnessLevel: String? = null,
    val primarySport: String? = null,
    val trainingAgeYears: Int? = null,
    val maxHeartRate: Int? = null,
    val restingHeartRate: Int? = null,
    val injuryNotes: String? = null,
    val weeklyAvailabilityHours: Int? = null,
    val goals: String? = null
)
