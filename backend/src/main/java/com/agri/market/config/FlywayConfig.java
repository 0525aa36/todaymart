package com.agri.market.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationInitializer;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Flyway Configuration
 * - Automatically repairs failed migrations before running migrate
 */
@Configuration
public class FlywayConfig {

    private static final Logger logger = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            logger.info("Running Flyway repair to fix any failed migrations...");
            try {
                flyway.repair();
                logger.info("Flyway repair completed successfully");
            } catch (Exception e) {
                logger.warn("Flyway repair failed, but continuing with migration: {}", e.getMessage());
            }

            logger.info("Running Flyway migrate...");
            flyway.migrate();
            logger.info("Flyway migrate completed successfully");
        };
    }
}
