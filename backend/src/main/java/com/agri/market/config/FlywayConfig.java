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

                    // Disable autocommit for explicit transaction control
                    conn.setAutoCommit(false);

                    int deleted = stmt.executeUpdate(
                        "DELETE FROM flyway_schema_history WHERE success = 0"
                    );
                    logger.info("Deleted {} failed migration(s) from flyway_schema_history", deleted);

                    // Explicitly commit the deletion
                    conn.commit();
                    logger.info("Committed deletion transaction");

                } catch (Exception cleanupException) {
                    logger.error("Failed to delete failed migrations: {}", cleanupException.getMessage());
                    throw new RuntimeException("Flyway migration failed and cleanup unsuccessful", cleanupException);
                }

                // Third attempt: repair after manual cleanup
                logger.info("Running Flyway repair after manual cleanup...");
                try {
                    flyway.repair();
                    logger.info("Flyway repair completed after manual cleanup");

                    // Final retry
                    logger.info("Final attempt: running Flyway migrate...");
                    flyway.migrate();
                    logger.info("Flyway migrate completed successfully after cleanup and repair");

                } catch (Exception retryException) {
                    logger.error("Flyway migration failed even after cleanup and repair: {}", retryException.getMessage());
                    throw new RuntimeException("Flyway migration failed after all recovery attempts", retryException);
                }
            }
        };
    }
}
