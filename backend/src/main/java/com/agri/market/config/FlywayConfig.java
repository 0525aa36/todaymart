package com.agri.market.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Flyway Configuration
 * - Automatically repairs failed migrations before running migrate
 * - Forcefully removes failed migrations if repair doesn't work
 */
@Configuration
public class FlywayConfig {

    private static final Logger logger = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            logger.info("Checking for failed Flyway migrations...");

            try {
                // First attempt: repair
                logger.info("Running Flyway repair...");
                flyway.repair();
                logger.info("Flyway repair completed successfully");

                // Try migrate
                logger.info("Running Flyway migrate...");
                flyway.migrate();
                logger.info("Flyway migrate completed successfully");

            } catch (FlywayException e) {
                logger.error("Flyway migrate failed: {}", e.getMessage());

                // Second attempt: manually delete failed migrations
                logger.warn("Attempting to forcefully remove failed migrations...");
                try (Connection conn = dataSource.getConnection();
                     Statement stmt = conn.createStatement()) {

                    int deleted = stmt.executeUpdate(
                        "DELETE FROM flyway_schema_history WHERE success = 0"
                    );
                    logger.info("Deleted {} failed migration(s) from flyway_schema_history", deleted);

                    // Retry migrate
                    logger.info("Retrying Flyway migrate after cleanup...");
                    flyway.migrate();
                    logger.info("Flyway migrate completed successfully after cleanup");

                } catch (Exception cleanupException) {
                    logger.error("Failed to clean up failed migrations: {}", cleanupException.getMessage());
                    throw new RuntimeException("Flyway migration failed and cleanup unsuccessful", cleanupException);
                }
            }
        };
    }
}
