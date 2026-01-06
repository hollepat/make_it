package org.make_it.backend.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

/**
 * Configuration properties for CORS settings.
 * Reads from application.yml under app.cors prefix.
 */
@ConfigurationProperties(prefix = "app.cors")
data class CorsProperties(
    val allowedOrigins: String = "http://localhost:5173"
)

/**
 * Web MVC configuration for CORS support.
 * Enables cross-origin requests from the configured frontend origins.
 */
@Configuration
class CorsConfig(
    private val corsProperties: CorsProperties
) {

    @Bean
    fun corsConfigurer(): WebMvcConfigurer {
        return object : WebMvcConfigurer {
            override fun addCorsMappings(registry: CorsRegistry) {
                val origins = corsProperties.allowedOrigins
                    .split(",")
                    .map { it.trim() }
                    .toTypedArray()

                registry.addMapping("/api/**")
                    .allowedOrigins(*origins)
                    .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600)
            }
        }
    }
}
