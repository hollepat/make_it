package org.make_it.backend.repository

import org.make_it.backend.model.ChatMessageRecord
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ChatMessageRepository : JpaRepository<ChatMessageRecord, Long> {
    fun findByMemoryId(memoryId: String): Optional<ChatMessageRecord>
    fun deleteByMemoryId(memoryId: String)
}
