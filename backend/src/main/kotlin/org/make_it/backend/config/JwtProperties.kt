package org.make_it.backend.config

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Configuration properties for JWT authentication.
 * Reads from application.yml under app.jwt prefix.
 *
 * @property secret The secret key used for signing JWTs (must be at least 32 characters)
 * @property accessTokenExpiration Expiration time for access tokens in milliseconds (default: 15 minutes)
 * @property refreshTokenExpiration Expiration time for refresh tokens in milliseconds (default: 7 days)
 */
@ConfigurationProperties(prefix = "app.jwt")
data class JwtProperties(
    val secret: String = "dev-secret-key-change-in-production-must-be-32-chars",
    val accessTokenExpiration: Long = 900_000, // 15 minutes in milliseconds
    val refreshTokenExpiration: Long = 604_800_000 // 7 days in milliseconds
)
