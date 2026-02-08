package org.make_it.backend.exception

/**
 * Base exception for authentication-related errors.
 */
sealed class AuthException(
    override val message: String,
    override val cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * Exception thrown when authentication fails (invalid credentials).
 */
class AuthenticationException(
    message: String = "Invalid email or password"
) : AuthException(message)

/**
 * Exception thrown when a user tries to register with an email that already exists.
 */
class EmailAlreadyExistsException(
    email: String
) : AuthException("An account with email '$email' already exists")

/**
 * Exception thrown when an invalid or expired invite code is used.
 */
class InvalidInviteCodeException(
    message: String = "Invalid or expired invite code"
) : AuthException(message)

/**
 * Exception thrown when an invalid or expired token is used.
 */
class InvalidTokenException(
    message: String = "Invalid or expired token"
) : AuthException(message)

/**
 * Exception thrown when a user's account is disabled.
 */
class AccountDisabledException(
    message: String = "This account has been disabled"
) : AuthException(message)
