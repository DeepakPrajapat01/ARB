# Build Stage
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
# Download dependencies for offline usage
RUN mvn dependency:go-offline -B
# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/target/resume-rebuilder-backend-*.jar app.jar

# (Optional but recommended) Install Playwright Chromium & OS dependencies 
# since the POM includes com.microsoft.playwright which requires a browser
RUN apt-get update && apt-get install -y ca-certificates tzdata \
    && java -cp app.jar com.microsoft.playwright.CLI install chromium \
    && java -cp app.jar com.microsoft.playwright.CLI install-deps chromium \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
