package org.make_it.backend.config

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Configuration properties for invite code functionality.
 * Reads from application.yml under app.invite prefix.
 *
 * @property bootstrapCode A special invite code that can be set via environment variable
 *                         to allow the first user to register. Empty string means disabled.
 * @property codeExpirationDays Number of days until generated invite codes expire (default: 7)
 */
@ConfigurationProperties(prefix = "app.invite")
data class InviteProperties(
    val bootstrapCode: String = "",
    val codeExpirationDays: Int = 7
)
