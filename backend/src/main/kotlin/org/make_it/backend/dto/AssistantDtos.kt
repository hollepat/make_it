package org.make_it.backend.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Request DTO for sending a message to the AI assistant.
 */
data class ChatRequest(
    @field:NotBlank(message = "Message is required")
    @field:Size(max = 5000, message = "Message must not exceed 5000 characters")
    val message: String
)

/**
 * Response DTO for AI assistant replies.
 */
data class ChatResponse(
    val reply: String
)
