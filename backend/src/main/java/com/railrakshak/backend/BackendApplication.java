package com.railrakshak.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

import java.net.InetAddress;
import java.net.UnknownHostException;

@SpringBootApplication
public class BackendApplication {

    private static final Logger logger = LoggerFactory.getLogger(BackendApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    /**
     * Documentation for Frontend Developers:
     * -------------------------------------
     * When running on a local Wi-Fi network, the mobile app (React Native/Expo)
     * should use the LAN IP address printed below instead of 'localhost'.
     * 
     * Example: http://192.168.1.x:8080/api/...
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();
        String port = env.getProperty("local.server.port", "8080");
        String hostAddress = "localhost";

        try {
            hostAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            logger.warn("Could not determine LAN IP address, falling back to localhost");
        }

        System.out.println("\n----------------------------------------------------------");
        System.out.println("RailRakshak Backend running at: http://" + hostAddress + ":" + port);
        System.out.println("External access enabled: http://0.0.0.0:" + port);
        System.out.println("----------------------------------------------------------\n");
    }
}
