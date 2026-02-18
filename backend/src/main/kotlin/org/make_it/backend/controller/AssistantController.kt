package org.make_it.backend.controller

import jakarta.validation.Valid
import org.make_it.backend.dto.ChatRequest
import org.make_it.backend.dto.ChatResponse
import org.make_it.backend.security.AuthenticatedUser
import org.make_it.backend.service.FitnessAssistant
import org.make_it.backend.service.PersistentChatMemoryStore
import org.make_it.backend.service.UserContext
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * REST controller for the AI fitness assistant.
 * Returns 503 if the assistant is not configured (no API key).
 */
@RestController
@RequestMapping("/api/assistant")
class AssistantController(
    private val fitnessAssistant: FitnessAssistant?,
    private val chatMemoryStore: PersistentChatMemoryStore
) {
    private val logger = LoggerFactory.getLogger(AssistantController::class.java)

    /**
     * Send a message to the AI fitness assistant.
     * The assistant can view and manage the user's sessions via tool calls.
     *
     * POST /api/assistant/chat
     */
    @PostMapping("/chat")
    fun chat(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @Valid @RequestBody request: ChatRequest
    ): ResponseEntity<ChatResponse> {
        if (fitnessAssistant == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ChatResponse(reply = "AI assistant is not configured. Please set the ANTHROPIC_API_KEY."))
        }
        logger.info("POST /api/assistant/chat - User {} sending message ({} chars)", user.id, request.message.length)
        try {
            UserContext.set(user.id)
            val reply = fitnessAssistant.chat(user.id.toString(), request.message)
            return ResponseEntity.ok(ChatResponse(reply = reply))
        } finally {
            UserContext.clear()
        }
    }

    /**
     * Clear the conversation history for the authenticated user.
     * The next message will start a fresh conversation.
     *
     * DELETE /api/assistant/chat
     */
    @DeleteMapping("/chat")
    fun clearHistory(
        @AuthenticationPrincipal user: AuthenticatedUser
    ): ResponseEntity<Unit> {
        logger.info("DELETE /api/assistant/chat - Clearing history for user {}", user.id)
        chatMemoryStore.deleteMessages(user.id.toString())
        return ResponseEntity.noContent().build()
    }
}
