package org.make_it.backend.config

import dev.langchain4j.memory.chat.MessageWindowChatMemory
import dev.langchain4j.model.anthropic.AnthropicChatModel
import dev.langchain4j.model.chat.ChatLanguageModel
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel
import dev.langchain4j.model.openai.OpenAiChatModel
import dev.langchain4j.service.AiServices
import org.make_it.backend.service.FitnessAssistant
import org.make_it.backend.service.PersistentChatMemoryStore
import org.make_it.backend.service.SessionTools
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Configuration for the AI fitness assistant.
 * Supports multiple providers (claude, gemini, einfra) selected via app.ai.provider.
 * The assistant feature is disabled when the relevant API key is not configured.
 */
@Configuration
class AiConfig(
    private val aiProperties: AiProperties
) {
    private val logger = LoggerFactory.getLogger(AiConfig::class.java)

    @Bean
    fun chatLanguageModel(): ChatLanguageModel? {
        val provider = aiProperties.provider.lowercase()
        val keyProvided = when (provider) {
            "gemini" -> aiProperties.geminiApiKey.isNotBlank()
            "einfra" -> aiProperties.einfraApiKey.isNotBlank()
            else -> aiProperties.apiKey.isNotBlank()
        }
        logger.info("AI provider: {}, API key provided: {}", provider, keyProvided)

        return when (provider) {
            "gemini" -> createGeminiModel()
            "einfra" -> createEinfraModel()
            else -> createAnthropicModel()
        }
    }

    private fun createAnthropicModel(): ChatLanguageModel? {
        if (aiProperties.apiKey.isBlank()) {
            logger.warn("Anthropic API key not configured - AI assistant will be disabled")
            return null
        }
        logger.info("Configuring Anthropic chat model: {}", aiProperties.modelName)
        return AnthropicChatModel.builder()
            .apiKey(aiProperties.apiKey)
            .modelName(aiProperties.modelName)
            .temperature(aiProperties.temperature)
            .maxTokens(aiProperties.maxTokens)
            .build()
    }

    private fun createGeminiModel(): ChatLanguageModel? {
        if (aiProperties.geminiApiKey.isBlank()) {
            logger.warn("Gemini API key not configured - AI assistant will be disabled")
            return null
        }
        logger.info("Configuring Gemini chat model: {}", aiProperties.geminiModelName)
        return GoogleAiGeminiChatModel.builder()
            .apiKey(aiProperties.geminiApiKey)
            .modelName(aiProperties.geminiModelName)
            .temperature(aiProperties.temperature)
            .build()
    }

    private fun createEinfraModel(): ChatLanguageModel? {
        if (aiProperties.einfraApiKey.isBlank()) {
            logger.warn("e-INFRA API key not configured - AI assistant will be disabled")
            return null
        }
        logger.info("Configuring e-INFRA chat model: {}", aiProperties.einfraModelName)
        return OpenAiChatModel.builder()
            .baseUrl("https://llm.ai.e-infra.cz/v1/")
            .apiKey(aiProperties.einfraApiKey)
            .modelName(aiProperties.einfraModelName)
            .temperature(aiProperties.temperature)
            .build()
    }

    @Bean
    fun fitnessAssistant(
        chatModel: ChatLanguageModel?,
        chatMemoryStore: PersistentChatMemoryStore,
        sessionTools: SessionTools
    ): FitnessAssistant? {
        if (chatModel == null) {
            logger.warn("AI assistant disabled - no chat model available")
            return null
        }
        logger.info("Building FitnessAssistant AI service with memory window of {} messages", aiProperties.memoryMaxMessages)
        return AiServices.builder(FitnessAssistant::class.java)
            .chatLanguageModel(chatModel)
            .chatMemoryProvider { memoryId ->
                MessageWindowChatMemory.builder()
                    .id(memoryId)
                    .maxMessages(aiProperties.memoryMaxMessages)
                    .chatMemoryStore(chatMemoryStore)
                    .build()
            }
            .tools(sessionTools)
            .build()
    }
}
