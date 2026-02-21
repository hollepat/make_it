package org.make_it.backend.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.UUID

/**
 * Entity storing athlete-specific attributes used by the AI coach to
 * personalise training recommendations.
 *
 * One-to-one with User; created on demand (get-or-create semantics).
 */
@Entity
@Table(name = "user_athlete_profile")
class UserAthleteProfile(
    @Id
    val id: UUID = UUID.randomUUID(),

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    val user: User,

    @Column
    var age: Int? = null,

    @Column(name = "weight_kg", precision = 5, scale = 2)
    var weightKg: BigDecimal? = null,

    @Column(name = "height_cm", precision = 5, scale = 2)
    var heightCm: BigDecimal? = null,

    /** beginner | intermediate | advanced | elite */
    @Column(name = "fitness_level", length = 20)
    var fitnessLevel: String? = null,

    @Column(name = "primary_sport", length = 50)
    var primarySport: String? = null,

    /** Years of consistent, structured training */
    @Column(name = "training_age_years")
    var trainingAgeYears: Int? = null,

    /** Measured or estimated maximum heart rate in bpm */
    @Column(name = "max_heart_rate")
    var maxHeartRate: Int? = null,

    /** Resting heart rate in bpm — daily readiness signal */
    @Column(name = "resting_heart_rate")
    var restingHeartRate: Int? = null,

    @Column(name = "injury_notes", columnDefinition = "TEXT")
    var injuryNotes: String? = null,

    /** Realistic hours per week the athlete can dedicate to training */
    @Column(name = "weekly_availability_hours")
    var weeklyAvailabilityHours: Int? = null,

    @Column(columnDefinition = "TEXT")
    var goals: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is UserAthleteProfile) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()

    override fun toString(): String =
        "UserAthleteProfile(id=$id, userId=${user.id}, fitnessLevel=$fitnessLevel)"
}
