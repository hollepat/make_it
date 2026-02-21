package org.make_it.backend.controller

import org.make_it.backend.dto.AthleteProfileResponse
import org.make_it.backend.dto.UpdateAthleteProfileRequest
import org.make_it.backend.security.AuthenticatedUser
import org.make_it.backend.service.AthleteProfileService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * REST controller for the athlete profile resource.
 *
 * GET  /api/athlete-profile  – returns the profile (creates empty one on first call)
 * PUT  /api/athlete-profile  – updates the profile (patch semantics: only non-null fields applied)
 */
@RestController
@RequestMapping("/api/athlete-profile")
class AthleteProfileController(
    private val athleteProfileService: AthleteProfileService
) {
    private val logger = LoggerFactory.getLogger(AthleteProfileController::class.java)

    @GetMapping
    fun getProfile(
        @AuthenticationPrincipal user: AuthenticatedUser
    ): ResponseEntity<AthleteProfileResponse> {
        logger.debug("GET /api/athlete-profile - user {}", user.id)
        return ResponseEntity.ok(athleteProfileService.getOrCreate(user.id))
    }

    @PutMapping
    fun updateProfile(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestBody request: UpdateAthleteProfileRequest
    ): ResponseEntity<AthleteProfileResponse> {
        logger.info("PUT /api/athlete-profile - user {}", user.id)
        return ResponseEntity.ok(athleteProfileService.update(user.id, request))
    }
}
