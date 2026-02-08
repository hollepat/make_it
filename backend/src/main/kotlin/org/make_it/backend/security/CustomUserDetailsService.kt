package org.make_it.backend.security

import org.make_it.backend.repository.UserRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

/**
 * Custom implementation of Spring Security's UserDetailsService.
 * Loads user information from the database by email address.
 */
@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    /**
     * Loads a user by their email address (used as username).
     *
     * @param username The user's email address
     * @return UserDetails implementation for the user
     * @throws UsernameNotFoundException if user is not found
     */
    override fun loadUserByUsername(username: String): UserDetails {
        val email = username.lowercase().trim()

        val user = userRepository.findByEmail(email)
            .orElseThrow {
                UsernameNotFoundException("User not found with email: $email")
            }

        return UserPrincipal.from(user)
    }
}
