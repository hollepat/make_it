package org.make_it.backend.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.make_it.backend.config.JwtProperties
import org.make_it.backend.model.User
import org.make_it.backend.model.UserRole
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

/**
 * Service for JWT token generation and validation.
 * Handles creation of access tokens and extraction of claims.
 */
@Service
class JwtService(
    private val jwtProperties: JwtProperties
) {
    private val logger = LoggerFactory.getLogger(JwtService::class.java)

    private val secretKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(jwtProperties.secret.toByteArray())
    }

    companion object {
        private const val CLAIM_USER_ID = "userId"
        private const val CLAIM_EMAIL = "email"
        private const val CLAIM_ROLE = "role"
    }

    /**
     * Generates an access token for the given user.
     *
     * @param user The user to generate a token for
     * @return The JWT access token string
     */
    fun generateAccessToken(user: User): String {
        val now = Date()
        val expiryDate = Date(now.time + jwtProperties.accessTokenExpiration)

        return Jwts.builder()
            .subject(user.id.toString())
            .claim(CLAIM_USER_ID, user.id.toString())
            .claim(CLAIM_EMAIL, user.email)
            .claim(CLAIM_ROLE, user.role.name)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(secretKey)
            .compact()
    }

    /**
     * Validates a JWT token and returns true if valid.
     *
     * @param token The JWT token to validate
     * @return true if the token is valid, false otherwise
     */
    fun validateToken(token: String): Boolean {
        return try {
            getClaims(token)
            true
        } catch (ex: ExpiredJwtException) {
            logger.debug("JWT token has expired: {}", ex.message)
            false
        } catch (ex: JwtException) {
            logger.warn("Invalid JWT token: {}", ex.message)
            false
        } catch (ex: IllegalArgumentException) {
            logger.warn("JWT claims string is empty: {}", ex.message)
            false
        }
    }

    /**
     * Extracts the user ID from a JWT token.
     *
     * @param token The JWT token
     * @return The user's UUID
     */
    fun getUserIdFromToken(token: String): UUID {
        val claims = getClaims(token)
        return UUID.fromString(claims[CLAIM_USER_ID] as String)
    }

    /**
     * Extracts the email from a JWT token.
     *
     * @param token The JWT token
     * @return The user's email address
     */
    fun getEmailFromToken(token: String): String {
        val claims = getClaims(token)
        return claims[CLAIM_EMAIL] as String
    }

    /**
     * Extracts the role from a JWT token.
     *
     * @param token The JWT token
     * @return The user's role
     */
    fun getRoleFromToken(token: String): UserRole {
        val claims = getClaims(token)
        return UserRole.valueOf(claims[CLAIM_ROLE] as String)
    }

    /**
     * Creates an AuthenticatedUser from a JWT token.
     *
     * @param token The JWT token
     * @return The authenticated user information
     */
    fun getAuthenticatedUserFromToken(token: String): AuthenticatedUser {
        val claims = getClaims(token)
        return AuthenticatedUser(
            id = UUID.fromString(claims[CLAIM_USER_ID] as String),
            email = claims[CLAIM_EMAIL] as String,
            role = UserRole.valueOf(claims[CLAIM_ROLE] as String)
        )
    }

    private fun getClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
