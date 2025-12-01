package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@ComponentScan(basePackages = {"com.example.demo", "com.agri.market"})
@EnableJpaRepositories(basePackages = "com.agri.market")
@EntityScan(basePackages = "com.agri.market")
@EnableScheduling
@EnableJpaAuditing
public class DemoApplication {

	@PostConstruct
	public void init() {
		// JVM 전체의 기본 시간대를 한국 시간(KST, UTC+9)으로 설정
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		System.out.println("Application Timezone: " + TimeZone.getDefault().getID());
	}

	public static void main(String[] args) {
		// JVM 전체의 기본 시간대를 한국 시간으로 설정 (Spring Context 생성 전에 실행)
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		System.out.println("JVM Timezone set to: " + TimeZone.getDefault().getID());

		SpringApplication.run(DemoApplication.class, args);
	}

}
