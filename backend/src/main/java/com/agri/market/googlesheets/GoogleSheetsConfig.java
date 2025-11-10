package com.agri.market.googlesheets;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

@Configuration
@ConditionalOnProperty(name = "google.sheets.enabled", havingValue = "true")
public class GoogleSheetsConfig {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(SheetsScopes.SPREADSHEETS);

    @Value("${google.sheets.application-name}")
    private String applicationName;

    @Value("${google.sheets.credentials.path:#{null}}")
    private String credentialsPath;

    @Value("${GOOGLE_SHEETS_CREDENTIALS:#{null}}")
    private String credentialsJson;

    @Bean
    public Sheets googleSheetsClient() throws IOException, GeneralSecurityException {
        final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        GoogleCredentials credentials = loadCredentials();

        return new Sheets.Builder(httpTransport, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                .setApplicationName(applicationName)
                .build();
    }

    private GoogleCredentials loadCredentials() throws IOException {
        InputStream credentialsStream;

        // 1. 환경 변수에서 JSON 문자열로 로드 (배포 환경)
        if (credentialsJson != null && !credentialsJson.isEmpty()) {
            credentialsStream = new ByteArrayInputStream(credentialsJson.getBytes());
        }
        // 2. 파일 경로에서 로드 (로컬 개발 환경)
        else if (credentialsPath != null && Files.exists(Paths.get(credentialsPath))) {
            credentialsStream = new FileInputStream(credentialsPath);
        }
        // 3. 기본 경로에서 로드
        else {
            throw new IOException("Google Sheets credentials not found. " +
                    "Set GOOGLE_SHEETS_CREDENTIALS environment variable or google.sheets.credentials.path property.");
        }

        try (credentialsStream) {
            return GoogleCredentials.fromStream(credentialsStream)
                    .createScoped(SCOPES);
        }
    }
}
