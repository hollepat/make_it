package org.make_it.backend.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime
import java.util.UUID

/**
 * Entity representing an invitation code for user registration.
 * Users must have a valid invite code to register (except for the first user using bootstrap code).
 * Each invite code can only be used once.
 */
@Entity
@Table(name = "invite_codes")
class InviteCode(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false, unique = true, length = 50)
    val code: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = true)
    val createdByUser: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "used_by_user_id", nullable = true)
    var usedByUser: User? = null,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    /**
     * Checks if this invite code has expired based on current time.
     */
    fun isExpired(): Boolean = LocalDateTime.now().isAfter(expiresAt)

    /**
     * Checks if this invite code has already been used.
     */
    fun isUsed(): Boolean = usedByUser != null

    /**
     * Checks if this invite code is valid (not expired and not used).
     */
    fun isValid(): Boolean = !isExpired() && !isUsed()

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is InviteCode) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()

    override fun toString(): String {
        return "InviteCode(id=$id, code='$code', expired=${isExpired()}, used=${isUsed()})"
    }
}
