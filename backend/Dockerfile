FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw -q -DskipTests dependency:go-offline

COPY src/ src/
RUN ./mvnw -q clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build /workspace/target/*.jar app.jar

ENV JAVA_OPTS=""
ENV SPRING_DATASOURCE_URL=""

EXPOSE 8080

USER spring

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
