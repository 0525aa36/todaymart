package com.agri.market.order;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 앱 시작 시 orders 테이블의 NULL version 값을 0으로 업데이트
 * primitive long 타입 사용으로 인한 NULL 값 오류 방지
 */
@Component
public class OrderVersionMigration implements ApplicationRunner {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int updated = entityManager.createNativeQuery(
            "UPDATE orders SET version = 0 WHERE version IS NULL"
        ).executeUpdate();

        if (updated > 0) {
            System.out.println("[OrderVersionMigration] Updated " + updated + " orders with NULL version to 0");
        }
    }
}
