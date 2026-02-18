package org.make_it.backend.service

import dev.langchain4j.data.message.ChatMessage
import dev.langchain4j.data.message.ChatMessageDeserializer
import dev.langchain4j.data.message.ChatMessageSerializer
import dev.langchain4j.store.memory.chat.ChatMemoryStore
import org.make_it.backend.model.ChatMessageRecord
import org.make_it.backend.repository.ChatMessageRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Persistent chat memory store backed by PostgreSQL.
 * Implements LangChain4j's ChatMemoryStore to serialize/deserialize
 * conversation messages as JSON in the chat_messages table.
 */
@Service
@Transactional(readOnly = true)
class PersistentChatMemoryStore(
    private val chatMessageRepository: ChatMessageRepository
) : ChatMemoryStore {

    private val logger = LoggerFactory.getLogger(PersistentChatMemoryStore::class.java)

    override fun getMessages(memoryId: Any): List<ChatMessage> {
        val id = memoryId.toString()
        logger.debug("Loading chat messages for memory {}", id)
        return chatMessageRepository.findByMemoryId(id)
            .map { ChatMessageDeserializer.messagesFromJson(it.messagesJson) }
            .orElse(emptyList())
    }

    @Transactional
    override fun updateMessages(memoryId: Any, messages: List<ChatMessage>) {
        val id = memoryId.toString()
        logger.debug("Updating chat messages for memory {} ({} messages)", id, messages.size)
        val json = ChatMessageSerializer.messagesToJson(messages)
        val record = chatMessageRepository.findByMemoryId(id)
            .orElse(ChatMessageRecord(memoryId = id))
        record.messagesJson = json
        record.updatedAt = LocalDateTime.now()
        chatMessageRepository.save(record)
    }

    @Transactional
    override fun deleteMessages(memoryId: Any) {
        val id = memoryId.toString()
        logger.info("Deleting chat messages for memory {}", id)
        chatMessageRepository.deleteByMemoryId(id)
    }
}
