# 1단계: 빌드
# Gradle 9.8.2가 미리 설치된 공식 이미지(내부 Java는 eclipse-temurin 21).
# ./gradlew를 쓰면 빌드 때마다 services.gradle.org에서 Gradle을 내려받는데,
# Render에서 이 다운로드가 실패(시간 초과·504)해서 설치된 gradle 명령을 바로 쓴다.
# Gradle 버전을 올리면 gradle/wrapper/gradle-wrapper.properties와 이 태그를 함께 바꾼다.
FROM gradle:9.8.2-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle bootJar -x test --no-daemon

# 2단계: 실행
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
