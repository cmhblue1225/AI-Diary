# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드를 제공합니다.

## 🎯 프로젝트 개요

**한 숨의 위로 : 감성 일기**는 사용자가 작성한 일기의 감정을 AI로 분석하고, 그에 맞는 음악 추천과 위로의 메시지를 제공하는 감정 분석 웹 애플리케이션입니다.

## 🏗️ 아키텍처

### 클라이언트-서버 분리 구조
- **client/**: 정적 HTML/CSS/JavaScript 프론트엔드
- **server/**: Express.js 기반 백엔드 API 서버

### 기술 스택
- **프론트엔드**: Vanilla HTML/CSS/JavaScript, Supabase 클라이언트
- **백엔드**: Node.js, Express.js, OpenAI API, Supabase
- **데이터베이스**: Supabase (PostgreSQL)
- **AI 서비스**: OpenAI GPT-3.5-turbo (감정 분석용)

## 📁 디렉토리 구조

```
newEmotionProject/
├── client/                 # 프론트엔드 (정적 파일)
│   ├── index.html         # 랜딩 페이지
│   ├── login.html         # 로그인 페이지
│   ├── signup.html        # 회원가입 페이지
│   ├── dashboard.html     # 대시보드
│   ├── write-diary.html   # 일기 작성
│   ├── my-diary.html      # 내 일기 목록
│   ├── chat.html          # AI 채팅
│   ├── community.html     # 커뮤니티
│   ├── stats.html         # 통계
│   ├── my-page.html       # 마이페이지
│   ├── style.css          # 공통 스타일
│   └── js/                # JavaScript 모듈들
│       ├── supabase.js    # Supabase 클라이언트 설정
│       ├── auth.js        # 인증 관련
│       ├── write-diary.js # 일기 작성 기능
│       ├── my-diary.js    # 일기 목록 관리
│       ├── chat.js        # AI 채팅 기능
│       └── [기타 페이지별 JS 파일들]
└── server/                # 백엔드 API 서버
    ├── index.js           # Express 서버 진입점
    ├── package.json       # 의존성 및 스크립트
    ├── .env               # 환경 변수 (OPENAI_API_KEY)
    └── routes/            # API 라우트들
        ├── analyze.js     # 감정 분석 API
        ├── feedback.js    # 피드백 생성 API
        ├── chat.js        # AI 채팅 API
        ├── emotionSummary.js # 감정 요약 API
        └── deleteUser.js  # 회원탈퇴 API
```

## 🚀 개발 명령어

### 서버 실행
```bash
cd server
npm start                  # 프로덕션 서버 실행 (포트 3000 또는 PORT 환경변수)
```

### 클라이언트 개발
클라이언트는 정적 파일이므로 별도의 빌드 과정이 없습니다.
- 로컬 개발: Live Server 등의 도구를 사용하여 `client/` 디렉토리 서빙
- 또는 간단한 HTTP 서버 실행: `python -m http.server 8000` (client 디렉토리에서)

## 🔧 환경 설정

### 필수 환경 변수
서버 실행을 위해 `server/.env` 파일에 다음이 필요합니다:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Supabase 설정
- **URL**: `https://vzmvgyxsscfyflgxcpnq.supabase.co`
- **공개 키**: 이미 `client/js/supabase.js`에 하드코딩됨
- 주요 테이블: `diaries`, `users`, `emotion_analysis` 등

## 🔄 핵심 데이터 플로우

### 감정 분석 프로세스
1. 사용자가 `write-diary.html`에서 일기 작성
2. 클라이언트에서 Supabase에 일기 저장
3. 서버의 `/api/analyze-emotion` 엔드포인트로 감정 분석 요청
4. OpenAI GPT-3.5-turbo가 감정을 5가지 중 하나로 분류: `happy`, `sad`, `angry`, `anxious`, `neutral`
5. 분석 결과를 클라이언트로 반환
6. 감정에 따른 음악 추천 및 위로 메시지 표시

### API 엔드포인트
- `POST /api/analyze-emotion`: 일기 내용 감정 분석
- `POST /api/feedback`: 감정 기반 위로 메시지 생성
- `POST /api/chat`: AI와의 채팅 대화
- `GET /api/emotion-summary`: 사용자 감정 요약 통계
- `DELETE /api/delete-user`: 회원탈퇴 처리

## 🎨 프론트엔드 특징

### 페이지별 주요 기능
- **index.html**: 애니메이션이 있는 랜딩 페이지
- **write-diary.html**: 일기 작성 + 실시간 감정 분석 + 음악 추천
- **my-diary.html**: 일기 목록 + 감정별 필터링
- **chat.html**: OpenAI 기반 AI 채팅 상담
- **stats.html**: 감정 분석 통계 시각화
- **community.html**: 사용자간 소통 기능

### 인증 시스템
- Supabase Auth 사용
- `auth.js`에서 세션 관리
- 각 페이지에서 로그인 상태 확인

## 🔒 보안 고려사항

### API 키 관리
- OpenAI API 키는 서버 환경변수로만 관리
- Supabase 공개 키는 클라이언트에 노출 (공개 키이므로 안전)
- RLS(Row Level Security) 정책으로 데이터 접근 제어

### 사용자 데이터
- 모든 사용자 데이터는 Supabase에서 RLS로 보호
- 세션 기반 인증으로 본인 데이터만 접근 가능

## 🎵 외부 서비스 연동

### 음악 추천 시스템
- 감정별로 미리 정의된 음악 목록 사용
- YouTube 임베드로 음악 재생 기능 제공
- 향후 Spotify API 연동 가능

### AI 채팅
- OpenAI GPT-3.5-turbo 모델 사용
- 감정 상담 전용 프롬프트 엔지니어링 적용
- 대화 히스토리는 Supabase에 저장

## 📊 감정 분석 로직

### 지원하는 감정 타입
- `happy`: 기쁨, 행복, 만족
- `sad`: 슬픔, 우울, 아쉬움
- `angry`: 화남, 짜증, 분노
- `anxious`: 불안, 걱정, 스트레스
- `neutral`: 중립, 평온, 일상

### 분석 정확도 향상을 위한 프롬프트
- 구체적인 감정 카테고리 제한
- JSON 형식 강제로 파싱 오류 최소화
- 한국어 텍스트 분석에 최적화된 프롬프트

## 🚧 알려진 제한사항

1. **프론트엔드 번들링 없음**: Vanilla JS 사용으로 모듈 번들링이나 트랜스파일링 과정 없음
2. **하드코딩된 설정**: 일부 설정값이 코드에 직접 포함됨
3. **단일 서버 인스턴스**: 수평 확장을 위한 구조적 준비 필요
4. **실시간 기능 제한**: WebSocket 기반 실시간 기능 미구현

## 💡 개발 시 주의사항

- 클라이언트와 서버는 별도 포트에서 실행 (CORS 설정 필요)
- Supabase RLS 정책 변경 시 프론트엔드 동작에 영향 가능
- OpenAI API 키 비용 관리 필요 (토큰 사용량 모니터링)
- 감정 분석 결과는 5가지 타입으로 제한됨 (확장 시 프론트엔드도 수정 필요)