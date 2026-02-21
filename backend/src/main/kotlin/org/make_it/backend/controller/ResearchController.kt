package org.make_it.backend.controller

import dev.langchain4j.model.chat.ChatLanguageModel
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Developer-only research endpoint.
 * Prompts the configured LLM to produce a structured report on which athlete
 * attributes matter most for training plan personalisation.
 *
 * Run once, read the output, then use it to validate the athlete profile schema.
 * Restricted to ADMIN role.
 */
@RestController
@RequestMapping("/api/research")
class ResearchController(
    private val chatLanguageModel: ChatLanguageModel?
) {
    private val logger = LoggerFactory.getLogger(ResearchController::class.java)

    @GetMapping("/athlete-profile")
    @PreAuthorize("hasRole('ADMIN')")
    fun athleteProfileResearch(): ResponseEntity<Map<String, String>> {
        if (chatLanguageModel == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(mapOf("error" to "AI model is not configured."))
        }

        logger.info("GET /api/research/athlete-profile - generating LLM research report")

        val prompt = """
            You are a sports scientist and AI training assistant developer.

            Produce a concise, structured research report answering the following question:

            "Which athlete attributes are most important to collect in order to personalise
            a training plan, and why?"

            For each attribute:
            1. Name the attribute
            2. Explain why it matters for training prescription (≤ 3 sentences, citing sports
               science principles where relevant)
            3. Rate its importance (Critical / High / Medium / Low)

            Focus on attributes that can realistically be self-reported by an amateur athlete
            via a mobile app form. Cover at minimum: age, training age / fitness level,
            resting heart rate, injury history, and weekly time availability.

            Format the output as a numbered markdown list.
        """.trimIndent()

        val report = chatLanguageModel.chat(prompt)

        logger.info("Research report generated ({} chars)", report.length)
        return ResponseEntity.ok(mapOf("report" to report))
    }
}
