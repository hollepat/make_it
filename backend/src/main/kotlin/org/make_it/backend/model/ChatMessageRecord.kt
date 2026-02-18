package org.make_it.backend.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

/**
 * Entity representing stored chat conversation for a user.
 * Stores the full message history as serialized JSON.
 * One row per user, keyed by memory_id (user UUID string).
 */
@Entity
@Table(name = "chat_messages")
class ChatMessageRecord(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "memory_id", nullable = false, unique = true, length = 255)
    val memoryId: String,

    @Column(name = "messages_json", nullable = false, columnDefinition = "TEXT")
    var messagesJson: String = "[]",

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ChatMessageRecord) return false
        return id != 0L && id == other.id
    }

    override fun hashCode(): Int = id.hashCode()

    override fun toString(): String = "ChatMessageRecord(id=$id, memoryId=$memoryId)"
}
