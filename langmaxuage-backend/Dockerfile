# ==================================================
# STAGE 1 — BUILD
# ==================================================
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# copy pom trước để cache dependencies
COPY pom.xml .

RUN mvn dependency:go-offline

# copy source code
COPY src ./src

# build jar
RUN mvn clean package -DskipTests

# ==================================================
# STAGE 2 — RUNTIME
# ==================================================
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]