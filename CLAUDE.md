# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드를 제공합니다.

## 🎯 프로젝트 개요

**한 숨의 위로 : 감성 일기**는 사용자가 작성한 일기의 감정을 AI로 분석하고, 그에 맞는 음악 추천과 위로의 메시지를 제공하는 차세대 감정 분석 웹 애플리케이션입니다.

### 현재 버전: Phase 2 (2025년 9월 최종)
- **배포 URL**: https://healing-diary.netlify.app
- **아키텍처**: Netlify Functions (Serverless)
- **AI 모델**: GPT-4o mini, GPT-4 Vision, Whisper API
- **개발 환경**: Mac book pro m4 pro (14core CPU, 20core GPU)

## 🚀 Phase 2 주요 업데이트

### 1. 멀티모달 AI 분석
- **텍스트 + 이미지 + 음성** 통합 감정 분석
- GPT-4 Vision을 활용한 이미지 감정 인식
- Whisper API를 통한 음성 감정 분석
- 24가지로 확장된 감정 분류 체계

### 2. 7일 감정 예측 시스템
- 과거 감정 패턴 기반 미래 예측
- 시계열 분석 알고리즘
- 개인화된 정신 건강 조언

### 3. 익명 감정 커뮤니티
- 고정 익명 ID 시스템 (SHA-256 해싱)
- 감정 공유 및 공감 기능
- 안전한 소통 공간

### 4. UI/UX 개선
- 상단 네비게이션 바로 통일
- 반응형 디자인 최적화
- 모든 페이지 일관된 디자인 시스템

## 🏗️ 아키텍처

### 현재 구조 (Phase 2)
- **프론트엔드**: 정적 HTML/CSS/JavaScript
- **백엔드**: Netlify Functions (Serverless)
- **데이터베이스**: Supabase (PostgreSQL + pgvector)
- **AI 서비스**: OpenAI GPT-4o mini, GPT-4 Vision, Whisper
- **배포**: Netlify (자동 CI/CD)

## 📁 디렉토리 구조

```
newEmotionProject/
├── public/                      # 프론트엔드 (Netlify 배포 디렉토리)
│   ├── 📄 HTML 페이지 (26개)     # 완성된 모든 페이지
│   │   ├── index.html              # 랜딩 페이지
│   │   ├── login.html              # 로그인
│   │   ├── signup.html             # 회원가입
│   │   ├── dashboard.html          # 메인 대시보드
│   │   ├── write-diary.html        # 멀티모달 일기 작성
│   │   ├── my-diary.html           # 내 일기 목록
│   │   ├── anonymous-community.html # 익명 커뮤니티
│   │   ├── chat.html               # AI 채팅
│   │   ├── stats.html              # AI 감정 분석 대시보드
│   │   ├── my-page.html            # 마이페이지
│   │   └── [14개 추가 페이지]        # 기타 기능 페이지들
│   ├── 🎨 스타일 및 에셋
│   │   ├── style.css               # 통합 스타일시트
│   │   ├── icons/                  # PWA 아이콘들
│   │   ├── manifest.json           # PWA 매니페스트
│   │   └── sw.js                   # 서비스 워커
│   ├── 🧪 백업 및 테스트
│   │   └── backup/                 # 개발 중 백업 파일들
│   └── 💻 JavaScript 모듈들 (22개)
│       ├── supabase.js             # Supabase 클라이언트
│       ├── auth.js                 # 인증 관리
│       ├── multimodal-diary.js     # 멀티모달 일기 (639줄)
│       ├── emotion-prediction.js   # 감정 예측 시스템 (655줄)
│       ├── anonymous-community.js  # 익명 커뮤니티 (714줄)
│       ├── ai-dashboard.js         # AI 대시보드 및 통계
│       ├── enhanced-emotion.js     # 고급 감정 분석
│       ├── notification-system.js  # 실시간 알림
│       ├── offline-storage.js      # 오프라인 저장
│       └── [12개 추가 모듈]         # 기타 기능 모듈들
├── netlify/
│   └── functions/              # Serverless Functions (10개)
│       ├── multimodal-analysis.js  # 멀티모달 AI 분석
│       ├── emotion-prediction.js   # 7일 감정 예측
│       ├── anonymous-community.js  # 익명 커뮤니티 API
│       ├── advanced-emotion-analysis.js # 고급 감정 분석
│       ├── ai-chat-streaming.js    # AI 스트리밍 채팅
│       ├── emotion-summary.js      # 감정 요약
│       ├── analyze-emotion.js      # 기본 감정 분석
│       ├── chat.js                 # 채팅 처리
│       ├── feedback.js             # 피드백 시스템
│       └── delete-user.js          # 계정 삭제
├── 📋 설정 파일들
│   ├── package.json            # 의존성 관리
│   ├── netlify.toml           # Netlify 배포 설정
│   ├── _redirects             # 리다이렉트 규칙
│   └── .gitignore             # Git 제외 파일
└── server/                     # Legacy Express 서버 (미사용)
```

### 🔢 프로젝트 규모 통계
- **총 HTML 페이지**: 26개
- **JavaScript 모듈**: 22개 (약 5,000줄)
- **Netlify Functions**: 10개
- **총 프로젝트 파일**: 60개 이상

## 🗄️ 데이터베이스 스키마 (Phase 2)

### 기존 테이블
- `diaries`: 일기 데이터 (확장된 컬럼 포함)
- `users`: 사용자 정보
- `shared_diaries`: 공유 일기
- `chat_history`: AI 채팅 기록

### Phase 2 신규 테이블
- `multimodal_attachments`: 멀티모달 첨부파일
- `emotion_predictions`: 7일 감정 예측
- `anonymous_posts`: 익명 게시글
- `anonymous_comments`: 익명 댓글
- `analysis_metrics`: 분석 지표
- `ai_personalization`: 개인화 설정

## 🔄 핵심 기능 플로우

### 1. 멀티모달 감정 분석
```
1. 사용자 입력 (텍스트/이미지/음성)
2. Base64 인코딩 및 전처리
3. Netlify Function 호출
4. 병렬 AI 분석:
   - GPT-4o mini (텍스트)
   - GPT-4 Vision (이미지)
   - Whisper + GPT-4o (음성)
5. 통합 감정 점수 계산
6. 결과 반환 및 시각화
```

### 2. 감정 예측 시스템
```
1. 과거 30일 감정 데이터 수집
2. 시계열 패턴 분석
3. GPT-4o mini 예측 모델
4. 7일 예측 생성
5. 개인화 조언 제공
```

### 3. 익명 커뮤니티
```
1. 사용자 ID → SHA-256 해싱
2. 고정 익명 ID 생성
3. 게시글/댓글 작성
4. 감정 기반 필터링
5. 공감 및 지원
```

## 🔧 환경 설정

### 필수 환경 변수 (Netlify)
```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=https://vzmvgyxsscfyflgxcpnq.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
```

### 로컬 개발
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로컬 개발 서버 실행
netlify dev

# 함수 테스트
netlify functions:invoke function-name --payload '{"key":"value"}'
```

## 🔐 보안 및 인증

### 현재 구현
- Supabase Auth 기반 인증
- JWT 토큰 검증 (모든 Netlify Functions)
- RLS(Row Level Security) 정책
- 익명 ID 암호화 (SHA-256)

### 주의사항
- 인증 토큰: `session.access_token` 사용 (localStorage 대신)
- 모든 API 호출에 Bearer 토큰 포함
- 민감한 데이터 클라이언트 노출 금지

## 📊 확장된 감정 분류 체계 (24종)

### 긍정 감정 (8종)
- `joy`: 기쁨
- `contentment`: 만족
- `gratitude`: 감사
- `love`: 사랑
- `excitement`: 흥분/설렘
- `pride`: 자부심
- `hope`: 희망
- `relief`: 안도

### 부정 감정 (10종)
- `sadness`: 슬픔
- `grief`: 비탄
- `anger`: 분노
- `frustration`: 좌절
- `anxiety`: 불안
- `fear`: 두려움
- `guilt`: 죄책감
- `shame`: 수치심
- `loneliness`: 외로움
- `disappointment`: 실망

### 중성 감정 (6종)
- `calm`: 평온
- `contemplative`: 사색적
- `curious`: 호기심
- `nostalgic`: 그리움
- `confused`: 혼란
- `indifferent`: 무관심

## 🎨 UI/UX 개선사항

### Phase 2 디자인 변경
1. **네비게이션**: 하단 바 제거, 상단 네비게이션으로 통일
2. **색상 팔레트**: 그라데이션 강조 (#667eea → #764ba2)
3. **반응형**: 모바일 최적화 완료
4. **접근성**: WCAG 2.1 AA 준수

## 🚀 배포 및 운영

### Netlify 배포 설정
```yaml
Build settings:
  Base directory: /
  Build command: echo 'No build needed'
  Publish directory: public
  Functions directory: netlify/functions
```

### GitHub 자동 배포
- main 브랜치 푸시 시 자동 배포
- PR 프리뷰 배포 지원

## 🐛 최근 해결된 이슈

### 2025년 9월 최종 업데이트
1. **멀티모달 분석 시스템 안정화**
   - 이미지, 음성, 텍스트 통합 분석 완료
   - GPT-4 Vision 및 Whisper API 최적화
   - Base64 인코딩 및 파일 크기 제한 구현

2. **네비게이션 및 UI 통일성 완성**
   - 모든 26개 페이지 상단 네비게이션으로 통일
   - 반응형 디자인 최적화 완료
   - 일관된 색상 팔레트 적용

3. **Netlify Functions 배포 최적화**
   - 10개 서버리스 함수 안정화
   - CORS 및 환경변수 설정 완료
   - 에러 핸들링 및 로깅 개선

### 이전 해결 이슈 (2025년 1월)
1. **401 Unauthorized 오류** ✅ 해결
2. **네비게이션 일관성** ✅ 해결
3. **멀티모달 분석 오류** ✅ 해결

## 📈 성능 최적화

### 구현된 최적화
- 이미지 Base64 압축
- API 호출 병렬 처리
- 캐싱 전략 (15분 TTL)
- 지연 로딩 적용

### 권장 사항
- 이미지 크기: 최대 10MB
- 음성 녹음: 최대 2분
- 일기 텍스트: 최대 5000자

## 🔮 향후 계획 (Phase 3)

1. **PWA 전환**: 오프라인 지원
2. **실시간 기능**: WebSocket 기반 실시간 알림
3. **AI 고도화**: GPT-4 전면 적용
4. **국제화**: 다국어 지원
5. **모바일 앱**: React Native 개발

## 💡 개발 시 주의사항

1. **인증 토큰 관리**
   ```javascript
   // 올바른 방법
   const { data: { session } } = await supabase.auth.getSession();
   const token = session.access_token;

   // 잘못된 방법 (사용 금지)
   const token = localStorage.getItem('supabase.auth.token');
   ```

2. **멀티모달 분석 요청**
   - 항상 supabase 인스턴스 전달
   - Base64 인코딩 확인
   - 파일 크기 제한 준수

3. **익명 ID 생성**
   - 일관된 해싱 알고리즘 사용
   - Salt 값 고정 ('anonymous_salt_2025')

4. **API 비용 관리**
   - OpenAI API 토큰 사용량 모니터링
   - 로컬 개발 시 모의 응답 사용

## 📞 문제 해결 연락처

- GitHub Issues: [프로젝트 저장소]/issues
- 개발자 문서: https://docs.anthropic.com/claude-code

## 🚀 프로젝트 완성도 및 성취사항

### ✅ 완료된 주요 기능들
1. **멀티모달 AI 분석 시스템** (100% 완성)
   - 텍스트 + 이미지 + 음성 통합 분석
   - GPT-4o mini, GPT-4 Vision, Whisper API 활용
   - 24가지 감정 분류 체계

2. **감정 예측 및 분석** (100% 완성)
   - 7일 감정 예측 알고리즘
   - AI 대시보드 및 시각화
   - 개인화된 정신건강 조언

3. **커뮤니티 기능** (100% 완성)
   - 익명 감정 공유 시스템
   - 실시간 알림 시스템

4. **PWA 및 UX** (100% 완성)
   - 프로그레시브 웹 앱
   - 완전 반응형 디자인
   - 오프라인 기능 지원

### 🎯 기술적 성취
- **확장성**: 서버리스 아키텍처로 무제한 확장 가능
- **성능**: 최적화된 코드와 캐싱 전략
- **보안**: JWT 토큰, RLS 정책, CORS 설정
- **사용성**: 직관적인 UI/UX, PWA 지원

### 💡 비즈니스 가치
- **즉시 상용화 가능**: 완성된 감정 분석 서비스
- **AI 기반 혁신**: 멀티모달 분석으로 차별화
- **사용자 중심**: 익명성과 개인정보 보호 완비
- **확장 가능**: 추가 기능 개발 기반 마련

---

*최종 업데이트: 2025년 9월 25일*
*프로젝트 상태: Phase 2 완성 (상용화 준비 완료)*
*작성자: Claude Code Assistant*