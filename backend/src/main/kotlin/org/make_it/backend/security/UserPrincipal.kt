package org.make_it.backend.security

import org.make_it.backend.model.User
import org.make_it.backend.model.UserRole
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.util.UUID

/**
 * Implementation of Spring Security's UserDetails interface.
 * Wraps the User entity to provide authentication and authorization information.
 */
class UserPrincipal(
    private val user: User
) : UserDetails {

    val id: UUID get() = user.id
    val displayName: String get() = user.displayName
    val role: UserRole get() = user.role

    override fun getAuthorities(): Collection<GrantedAuthority> {
        return listOf(SimpleGrantedAuthority("ROLE_${user.role.name}"))
    }

    override fun getPassword(): String = user.passwordHash

    override fun getUsername(): String = user.email

    override fun isAccountNonExpired(): Boolean = true

    override fun isAccountNonLocked(): Boolean = true

    override fun isCredentialsNonExpired(): Boolean = true

    override fun isEnabled(): Boolean = user.enabled

    /**
     * Converts this UserPrincipal to an AuthenticatedUser for use in the application.
     */
    fun toAuthenticatedUser(): AuthenticatedUser = AuthenticatedUser(
        id = user.id,
        email = user.email,
        role = user.role
    )

    companion object {
        /**
         * Creates a UserPrincipal from a User entity.
         */
        fun from(user: User): UserPrincipal = UserPrincipal(user)
    }
}
