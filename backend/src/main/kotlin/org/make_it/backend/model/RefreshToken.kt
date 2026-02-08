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
 * Entity representing a refresh token for JWT authentication.
 * Refresh tokens allow users to obtain new access tokens without re-authenticating.
 * They can be revoked to force re-authentication.
 */
@Entity
@Table(name = "refresh_tokens")
class RefreshToken(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false, unique = true, length = 500)
    val token: String,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,

    @Column(nullable = false)
    var revoked: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    /**
     * Checks if this refresh token has expired based on current time.
     */
    fun isExpired(): Boolean = LocalDateTime.now().isAfter(expiresAt)

    /**
     * Checks if this refresh token is valid (not expired and not revoked).
     */
    fun isValid(): Boolean = !isExpired() && !revoked

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RefreshToken) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()

    override fun toString(): String {
        return "RefreshToken(id=$id, userId=${user.id}, expiresAt=$expiresAt, revoked=$revoked)"
    }
}
