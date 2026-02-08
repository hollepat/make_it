package org.make_it.backend.exception

import org.make_it.backend.dto.ErrorResponse
import org.make_it.backend.dto.FieldError
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.WebRequest
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException

/**
 * Global exception handler for REST controllers.
 * Provides consistent error responses across all endpoints.
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    /**
     * Handles AuthenticationException - returns 401 Unauthorized.
     */
    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthenticationException(
        ex: AuthenticationException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Authentication failed: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.UNAUTHORIZED.value(),
            error = HttpStatus.UNAUTHORIZED.reasonPhrase,
            message = ex.message,
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error)
    }

    /**
     * Handles AccountDisabledException - returns 401 Unauthorized.
     */
    @ExceptionHandler(AccountDisabledException::class)
    fun handleAccountDisabledException(
        ex: AccountDisabledException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Account disabled: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.UNAUTHORIZED.value(),
            error = HttpStatus.UNAUTHORIZED.reasonPhrase,
            message = ex.message,
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error)
    }

    /**
     * Handles InvalidTokenException - returns 401 Unauthorized.
     */
    @ExceptionHandler(InvalidTokenException::class)
    fun handleInvalidTokenException(
        ex: InvalidTokenException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Invalid token: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.UNAUTHORIZED.value(),
            error = HttpStatus.UNAUTHORIZED.reasonPhrase,
            message = ex.message,
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error)
    }

    /**
     * Handles EmailAlreadyExistsException - returns 409 Conflict.
     */
    @ExceptionHandler(EmailAlreadyExistsException::class)
    fun handleEmailAlreadyExistsException(
        ex: EmailAlreadyExistsException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Email already exists: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.CONFLICT.value(),
            error = HttpStatus.CONFLICT.reasonPhrase,
            message = ex.message,
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error)
    }

    /**
     * Handles InvalidInviteCodeException - returns 400 Bad Request.
     */
    @ExceptionHandler(InvalidInviteCodeException::class)
    fun handleInvalidInviteCodeException(
        ex: InvalidInviteCodeException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Invalid invite code: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = ex.message,
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    /**
     * Handles Spring Security AccessDeniedException - returns 403 Forbidden.
     */
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(
        ex: AccessDeniedException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Access denied: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.FORBIDDEN.value(),
            error = HttpStatus.FORBIDDEN.reasonPhrase,
            message = "You do not have permission to access this resource",
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error)
    }

    /**
     * Handles ResourceNotFoundException - returns 404 Not Found.
     */
    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleResourceNotFound(
        ex: ResourceNotFoundException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Resource not found: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.NOT_FOUND.value(),
            error = HttpStatus.NOT_FOUND.reasonPhrase,
            message = ex.message,
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error)
    }

    /**
     * Handles BusinessRuleViolationException - returns 400 Bad Request.
     */
    @ExceptionHandler(BusinessRuleViolationException::class)
    fun handleBusinessRuleViolation(
        ex: BusinessRuleViolationException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Business rule violation: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = ex.message,
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    /**
     * Handles ValidationException from service layer - returns 400 Bad Request.
     */
    @ExceptionHandler(ValidationException::class)
    fun handleValidationException(
        ex: ValidationException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Validation error: {}", ex.message)

        val details = ex.field?.let {
            listOf(FieldError(field = it, message = ex.message))
        }

        val error = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = ex.message,
            path = getPath(request),
            details = details
        )

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    /**
     * Handles Bean Validation errors - returns 400 Bad Request with field details.
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(
        ex: MethodArgumentNotValidException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Validation failed for request: {}", ex.bindingResult.fieldErrors.size)

        val fieldErrors = ex.bindingResult.fieldErrors.map { fieldError ->
            FieldError(
                field = fieldError.field,
                message = fieldError.defaultMessage ?: "Invalid value",
                rejectedValue = fieldError.rejectedValue
            )
        }

        val error = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Validation Failed",
            message = "One or more fields have validation errors",
            path = getPath(request),
            details = fieldErrors
        )

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    /**
     * Handles type mismatch errors (e.g., invalid UUID format) - returns 400 Bad Request.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(
        ex: MethodArgumentTypeMismatchException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Type mismatch for parameter {}: {}", ex.name, ex.value)

        val error = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = "Invalid value '${ex.value}' for parameter '${ex.name}'",
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    /**
     * Handles malformed JSON requests - returns 400 Bad Request.
     */
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleMalformedJson(
        ex: HttpMessageNotReadableException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Malformed JSON request: {}", ex.message)

        val error = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = "Malformed JSON request body",
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    /**
     * Handles all other unexpected exceptions - returns 500 Internal Server Error.
     * Logs the full stack trace for debugging but returns a generic message to the client.
     */
    @ExceptionHandler(Exception::class)
    fun handleAllExceptions(
        ex: Exception,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Unexpected error occurred", ex)

        val error = ErrorResponse(
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = HttpStatus.INTERNAL_SERVER_ERROR.reasonPhrase,
            message = "An unexpected error occurred. Please try again later.",
            path = getPath(request)
        )

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error)
    }

    private fun getPath(request: WebRequest): String? {
        return request.getDescription(false).removePrefix("uri=")
    }
}
