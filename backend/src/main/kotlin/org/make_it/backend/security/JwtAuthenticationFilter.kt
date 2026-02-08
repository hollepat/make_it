package org.make_it.backend.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * JWT authentication filter that processes incoming requests.
 * Extracts and validates JWT tokens from the Authorization header,
 * then sets the authentication in the SecurityContext.
 */
@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(JwtAuthenticationFilter::class.java)

    companion object {
        private const val AUTHORIZATION_HEADER = "Authorization"
        private const val BEARER_PREFIX = "Bearer "
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val jwt = extractJwtFromRequest(request)

            if (jwt != null && jwtService.validateToken(jwt)) {
                val authenticatedUser = jwtService.getAuthenticatedUserFromToken(jwt)

                val authorities = listOf(
                    SimpleGrantedAuthority("ROLE_${authenticatedUser.role.name}")
                )

                val authentication = UsernamePasswordAuthenticationToken(
                    authenticatedUser,
                    null,
                    authorities
                )

                authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
                SecurityContextHolder.getContext().authentication = authentication

                log.debug("Authenticated user: {} with role: {}", authenticatedUser.email, authenticatedUser.role)
            }
        } catch (ex: Exception) {
            log.error("Could not set user authentication in security context", ex)
        }

        filterChain.doFilter(request, response)
    }

    /**
     * Extracts the JWT token from the Authorization header.
     *
     * @param request The HTTP request
     * @return The JWT token string or null if not present
     */
    private fun extractJwtFromRequest(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader(AUTHORIZATION_HEADER)

        return if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            bearerToken.substring(BEARER_PREFIX.length)
        } else {
            null
        }
    }
}
