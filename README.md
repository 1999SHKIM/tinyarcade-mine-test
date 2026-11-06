# TinyArcade

코딩학습 타이니 게이미피케이션 플랫폼 (메인 플랫폼 레포)

```
tinyarcade/
├── backend/    Spring Boot 4.1.2 (Java 21, Gradle)
├── frontend/   React + TypeScript (Vite)
└── docs/       작업명세 (Git 미추적, 팀원에게 직접 받기)
```

## 로컬 실행 방법

### 1. 도구 버전 확인

| 도구 | 확인 명령 | 버전 |
|---|---|---|
| Git | `git --version` | 2.55.0 |
| JDK | `java -version` | 21 |
| Node.js | `node -v` | 24.19.0 (LTS) |
| PostgreSQL | `SELECT version();` | 16.x |
| IDE | — | IntelliJ(backend), VS Code(frontend) |

> `java -version`이 21이 아니면 시스템 환경변수 `JAVA_HOME`을 JDK 21 경로로 바꾸고, PATH에서 `%JAVA_HOME%\bin`을 다른 JDK보다 앞에 둔다. 새 터미널에서 다시 확인한다.

### 2. 로컬 DB 만들기

`postgres` 계정으로 접속(pgAdmin 또는 `psql -U postgres`)해서 실행한다. 사용자 이름·비밀번호는 각자 정하고, DB 이름은 `tinyarcade_db`로 통일한다.

```sql
CREATE USER 내사용자이름 WITH PASSWORD '내비밀번호';
CREATE DATABASE tinyarcade_db OWNER 내사용자이름;
```

### 3. `backend/.env` 만들기

`backend/.env.sample`을 복사해 `backend/.env`를 만들고, 2번에서 정한 사용자 이름·비밀번호를 채운다. `.env`는 Git에 올라가지 않는다.

### 4. backend 실행 (IntelliJ)

1. IntelliJ로 `tinyarcade/` 폴더(최상위)를 연다.
2. `backend/build.gradle`을 우클릭해 **Link Gradle Project**(또는 알림의 Load Gradle Project)를 누른다.
3. **Settings → Build Tools → Gradle → Gradle JVM**을 21로 지정한다.
4. **Settings → Build → Compiler → Annotation Processors → Enable annotation processing**을 켠다(Lombok).
5. `BackendApplication` 실행 구성의 **Working directory**를 `backend/` 폴더로 지정한다(`.env`를 읽기 위해).
6. 실행한 뒤 http://localhost:8080/api/health 에서 `ok`를 확인한다.

> 터미널에서 실행하려면 `backend/`에서 `gradlew.bat bootRun`(macOS/Linux는 `./gradlew bootRun`)을 실행한다.

### 5. frontend 실행

```bash
cd frontend
npm install      # Windows PowerShell은 npm.cmd install
npm run dev      # Windows PowerShell은 npm.cmd run dev
```

backend를 켠 상태에서 http://localhost:5173 에 `API 상태: ok`가 보이면 성공이다.

### 6. docs/

`docs/`는 Git에 올리지 않는다(개인정보 포함). 작업명세는 팀원에게 직접 받아 `docs/`에 둔다.

## backend 패키지 구조

기능(도메인)별 패키지로 나눈다. 각 패키지의 `package-info.java`에 담당·작업 번호·근거가 적혀 있다. 자세한 규칙은 `docs/03_10_backend_structure` (변경될 수 있음).

| 패키지 | 내용 | 담당 |
|---|---|---|
| `global` (security, error, config) | 인증·권한, 공통 오류 형식 | 김 |
| `health` | `/api/health` | 김 |
| `user`, `auth` | 유저, 가입·로그인 | 김 |
| `app` | 타이니앱 등록·배포·게임 파일 전달 | 김 |
| `session` | 세션·점수 제출·이상값 플래그 | 김 |
| `leaderboard`, `vote` | 앱 리더보드, 추천·비추천 | 김 |
| `ranking`, `setting` | 주간 마감·유저 랭킹, 목데이터 토글 | 김 |
| `board` | 게시판·댓글 | 허 |
| `mypage` | 마이페이지 | 허 |
| `admin` | 관리자 기능 | 허 |

## 협업 규칙

- `main`에 직접 push하지 않는다. `feature/기능명` 브랜치에서 작업하고 PR을 올린다. main 병합은 PM(허)이 판단한다.
- 커밋 메시지 앞에 `feat:`, `fix:`, `docs:`, `chore:`를 붙인다.
- 라이브러리가 추가되면, pull한 뒤 backend는 Gradle 새로고침, frontend는 `npm install`을 한다.
- 개발 DB는 각자 따로이므로 테스트 데이터는 공유되지 않는다.
