package org.make_it.backend.service

import org.make_it.backend.config.InviteProperties
import org.make_it.backend.config.JwtProperties
import org.make_it.backend.dto.AuthResponse
import org.make_it.backend.dto.LoginRequest
import org.make_it.backend.dto.RefreshTokenRequest
import org.make_it.backend.dto.RegisterRequest
import org.make_it.backend.dto.UserResponse
import org.make_it.backend.exception.AccountDisabledException
import org.make_it.backend.exception.AuthenticationException
import org.make_it.backend.exception.EmailAlreadyExistsException
import org.make_it.backend.exception.InvalidInviteCodeException
import org.make_it.backend.exception.InvalidTokenException
import org.make_it.backend.model.RefreshToken
import org.make_it.backend.model.User
import org.make_it.backend.model.UserRole
import org.make_it.backend.repository.InviteCodeRepository
import org.make_it.backend.repository.RefreshTokenRepository
import org.make_it.backend.repository.UserRepository
import org.make_it.backend.security.JwtService
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.LocalDateTime
import java.util.Base64
import java.util.UUID

/**
 * Service handling authentication operations including registration, login,
 * token refresh, and logout.
 */
@Service
@Transactional(readOnly = true)
class AuthService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val inviteCodeRepository: InviteCodeRepository,
    private val jwtService: JwtService,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProperties: JwtProperties,
    private val inviteProperties: InviteProperties
) {
    private val logger = LoggerFactory.getLogger(AuthService::class.java)
    private val secureRandom = SecureRandom()

    /**
     * Registers a new user with the provided credentials and invite code.
     *
     * @param request The registration request containing email, password, display name, and invite code
     * @return AuthResponse with access token, refresh token, and user information
     * @throws EmailAlreadyExistsException if email is already registered
     * @throws InvalidInviteCodeException if invite code is invalid, expired, or already used
     */
    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        val email = request.email.lowercase().trim()
        val inviteCode = request.inviteCode?.trim()

        logger.info("Processing registration for email: {}", email)

        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            logger.warn("Registration failed: email already exists: {}", email)
            throw EmailAlreadyExistsException(email)
        }

        // Validate invite code if required
        val dbInviteCode = if (inviteProperties.required) {
            if (inviteCode.isNullOrBlank()) {
                logger.warn("Registration failed: invite code is required but not provided")
                throw InvalidInviteCodeException("Invite code is required")
            }
            validateAndGetInviteCode(inviteCode)
        } else {
            logger.info("Invite code not required, skipping validation")
            null
        }

        // Create the new user
        val user = User(
            email = email,
            passwordHash = passwordEncoder.encode(request.password)!!,
            displayName = request.displayName.trim(),
            role = UserRole.USER,
            enabled = true
        )

        val savedUser = userRepository.save(user)
        logger.info("Created new user with id: {}", savedUser.id)

        // Mark invite code as used (if it was a database invite, not bootstrap)
        dbInviteCode?.let { invite ->
            invite.usedByUser = savedUser
            inviteCodeRepository.save(invite)
            logger.info("Invite code {} used by user {}", invite.code, savedUser.id)
        }

        // Generate tokens
        return generateAuthResponse(savedUser)
    }

    /**
     * Authenticates a user with email and password.
     *
     * @param request The login request containing email and password
     * @return AuthResponse with access token, refresh token, and user information
     * @throws AuthenticationException if credentials are invalid
     * @throws AccountDisabledException if account is disabled
     */
    @Transactional
    fun login(request: LoginRequest): AuthResponse {
        val email = request.email.lowercase().trim()

        logger.info("Processing login for email: {}", email)

        val user = userRepository.findByEmail(email)
            .orElseThrow {
                logger.warn("Login failed: user not found: {}", email)
                AuthenticationException()
            }

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            logger.warn("Login failed: invalid password for user: {}", email)
            throw AuthenticationException()
        }

        if (!user.enabled) {
            logger.warn("Login failed: account disabled for user: {}", email)
            throw AccountDisabledException()
        }

        logger.info("User {} logged in successfully", user.id)

        return generateAuthResponse(user)
    }

    /**
     * Refreshes an access token using a valid refresh token.
     * The old refresh token is revoked and a new one is issued (token rotation).
     *
     * @param request The refresh token request
     * @return AuthResponse with new access token, new refresh token, and user information
     * @throws InvalidTokenException if refresh token is invalid, expired, or revoked
     */
    @Transactional
    fun refreshToken(request: RefreshTokenRequest): AuthResponse {
        logger.debug("Processing token refresh")

        val refreshToken = refreshTokenRepository.findByToken(request.refreshToken)
            .orElseThrow {
                logger.warn("Token refresh failed: token not found")
                InvalidTokenException("Invalid refresh token")
            }

        if (!refreshToken.isValid()) {
            logger.warn("Token refresh failed: token is expired or revoked")
            throw InvalidTokenException("Refresh token is expired or revoked")
        }

        val user = refreshToken.user

        if (!user.enabled) {
            logger.warn("Token refresh failed: user account is disabled")
            throw AccountDisabledException()
        }

        // Revoke the old refresh token (token rotation)
        refreshToken.revoked = true
        refreshTokenRepository.save(refreshToken)

        logger.info("Token refreshed successfully for user {}", user.id)

        return generateAuthResponse(user)
    }

    /**
     * Logs out a user by revoking all their refresh tokens.
     *
     * @param userId The ID of the user to log out
     */
    @Transactional
    fun logout(userId: UUID) {
        logger.info("Processing logout for user: {}", userId)

        val revokedCount = refreshTokenRepository.revokeAllByUserId(userId)
        logger.info("Revoked {} refresh tokens for user {}", revokedCount, userId)
    }

    /**
     * Gets user information by ID.
     *
     * @param userId The user's UUID
     * @return UserResponse with user information
     */
    fun getUserById(userId: UUID): UserResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { AuthenticationException("User not found") }

        return UserResponse.from(user)
    }

    /**
     * Validates the invite code and returns the database InviteCode entity if applicable.
     * Returns null if the bootstrap code was used.
     */
    private fun validateAndGetInviteCode(code: String): org.make_it.backend.model.InviteCode? {
        // Check if it's the bootstrap code
        if (inviteProperties.bootstrapCode.isNotBlank() && code == inviteProperties.bootstrapCode) {
            logger.info("Bootstrap invite code used for registration")
            return null
        }

        // Look up the invite code in the database
        val inviteCode = inviteCodeRepository.findByCode(code)
            .orElseThrow {
                logger.warn("Registration failed: invalid invite code: {}", code)
                InvalidInviteCodeException("Invalid invite code")
            }

        if (inviteCode.isExpired()) {
            logger.warn("Registration failed: invite code expired: {}", code)
            throw InvalidInviteCodeException("Invite code has expired")
        }

        if (inviteCode.isUsed()) {
            logger.warn("Registration failed: invite code already used: {}", code)
            throw InvalidInviteCodeException("Invite code has already been used")
        }

        return inviteCode
    }

    /**
     * Generates an AuthResponse with access and refresh tokens for the given user.
     */
    private fun generateAuthResponse(user: User): AuthResponse {
        val accessToken = jwtService.generateAccessToken(user)
        val refreshToken = createRefreshToken(user)

        return AuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken.token,
            tokenType = "Bearer",
            expiresIn = jwtProperties.accessTokenExpiration / 1000, // Convert to seconds
            user = UserResponse.from(user)
        )
    }

    /**
     * Creates and saves a new refresh token for the user.
     */
    private fun createRefreshToken(user: User): RefreshToken {
        val tokenBytes = ByteArray(64)
        secureRandom.nextBytes(tokenBytes)
        val tokenString = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes)

        val expiresAt = LocalDateTime.now().plusSeconds(jwtProperties.refreshTokenExpiration / 1000)

        val refreshToken = RefreshToken(
            user = user,
            token = tokenString,
            expiresAt = expiresAt
        )

        return refreshTokenRepository.save(refreshToken)
    }
}
