package org.make_it.backend

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan("org.make_it.backend.config")
class MakeItApplication

fun main(args: Array<String>) {
    runApplication<MakeItApplication>(*args)
}
