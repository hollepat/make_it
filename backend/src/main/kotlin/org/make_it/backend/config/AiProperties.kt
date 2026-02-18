package org.make_it.backend.config

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Configuration properties for the AI fitness assistant.
 * Reads from application.yml under app.ai prefix.
 *
 * @property apiKey The Anthropic API key for the chat model
 * @property modelName The model to use (default: claude-sonnet-4-20250514)
 * @property temperature Sampling temperature (0.0 - 1.0)
 * @property maxTokens Maximum tokens in the response
 * @property memoryMaxMessages Maximum number of messages to retain in conversation memory
 */
@ConfigurationProperties(prefix = "app.ai")
data class AiProperties(
    val provider: String = "claude",
    val apiKey: String = "",
    val modelName: String = "claude-sonnet-4-20250514",
    val temperature: Double = 0.7,
    val maxTokens: Int = 4096,
    val memoryMaxMessages: Int = 50,
    val geminiApiKey: String = "",
    val geminiModelName: String = "gemini-2.0-flash",
    val einfraApiKey: String = "",
    val einfraModelName: String = "deepseek-v3.2"
)
