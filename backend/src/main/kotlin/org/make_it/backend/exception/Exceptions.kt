package org.make_it.backend.exception

import java.util.UUID

/**
 * Base exception for application-specific errors.
 */
sealed class ApplicationException(
    override val message: String,
    override val cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * Exception thrown when a requested resource is not found.
 */
class ResourceNotFoundException(
    resourceType: String,
    id: UUID
) : ApplicationException("$resourceType with id $id not found")

/**
 * Exception thrown when a business rule is violated.
 */
class BusinessRuleViolationException(
    message: String
) : ApplicationException(message)

/**
 * Exception thrown when input validation fails at the service layer.
 */
class ValidationException(
    message: String,
    val field: String? = null
) : ApplicationException(message)
