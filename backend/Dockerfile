# Build Stage
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM mcr.microsoft.com/playwright/java:v1.44.0-jammy
WORKDIR /app

# Ensure exactly ONE Java runtime exists (Java 21). 
# We purge the default Java runtime (11/17) provided by the Playwright base image
# and install openjdk-21-jre-headless cleanly.
RUN apt-get update && \
    apt-get remove --purge -y "^openjdk-.*" default-jdk default-jre && \
    apt-get autoremove -y && \
    apt-get install -y --no-install-recommends openjdk-21-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Override the base image JAVA_HOME to standard Jammy Java 21 path
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

# Copy the built JAR from builder
COPY --from=builder /app/target/resume-rebuilder-backend-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
