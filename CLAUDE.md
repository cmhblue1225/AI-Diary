# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드를 제공합니다.

## 🎯 프로젝트 개요

**한 숨의 위로 : 감성 일기**는 사용자가 작성한 일기의 감정을 AI로 분석하고, 그에 맞는 음악 추천과 위로의 메시지를 제공하는 차세대 감정 분석 웹 애플리케이션입니다.

### 현재 버전: Phase 2 (2025년 12월 최종)
- **배포 URL**: https://healing-diary.netlify.app
- **아키텍처**: Netlify Functions (Serverless)
- **AI 모델**: GPT-4o mini (감정 분석, 상담, 안전 필터링)
- **개발 환경**: Mac book pro m4 pro (14core CPU, 20core GPU)
- **Supabase 프로젝트**: vzmvgyxsscfyflgxcpnq (finalEmotion)
- **현재 일기 수**: 285개

## 🚀 Phase 2 주요 업데이트

### 1. 핵심 일기 작성 시스템 (단순화 완료)
- **기본 텍스트 기반 일기 작성** 인터페이스
- GPT-4o mini를 활용한 감정 분석
- **5개 핵심 감정 시스템** (happy, sad, angry, anxious, neutral)
- 직관적이고 깔끔한 단일 작성 모드

### 2. 종합적 안전 관리 시스템
- **자살 예방 안전 필터링** 시스템
- 클라이언트 + 서버 이중 검증
- 위험 키워드 실시간 감지 (24가지 변형 표현)
- 자살예방상담전화 109번 즉시 연결

### 3. 익명 감정 커뮤니티
- 고정 익명 ID 시스템 (SHA-256 해싱)
- 감정 공유 및 공감 기능
- 안전한 소통 공간

### 4. AI 상담 시스템
- 일기 기반 개인화 상담
- 실시간 채팅 상담
- 위기 상황 즉시 감지 및 대응

### 5. UI/UX 개선
- 상단 네비게이션 바로 통일
- 반응형 디자인 최적화
- 모든 페이지 일관된 디자인 시스템
- **프리미엄 통계 대시보드 완전 재설계 (2025년 12월)**

## 🏗️ 아키텍처

### 현재 구조 (Phase 2)
- **프론트엔드**: 정적 HTML/CSS/JavaScript
- **백엔드**: Netlify Functions (Serverless)
- **데이터베이스**: Supabase PostgreSQL (vzmvgyxsscfyflgxcpnq)
- **AI 서비스**: OpenAI GPT-4o mini
- **배포**: Netlify (자동 CI/CD)

## 📁 디렉토리 구조

```
newEmotionProject/
├── public/                      # 프론트엔드 (Netlify 배포 디렉토리)
│   ├── 📄 HTML 페이지 (19개)     # 완성된 모든 페이지
│   │   ├── index.html              # 랜딩 페이지
│   │   ├── login.html              # 로그인
│   │   ├── signup.html             # 회원가입
│   │   ├── dashboard.html          # 메인 대시보드
│   │   ├── write-diary.html        # 기본 일기 작성 (단순화 완료)
│   │   ├── my-diary.html           # 내 일기 목록
│   │   ├── anonymous-community.html # 익명 커뮤니티
│   │   ├── chat.html               # AI 채팅
│   │   ├── stats.html              # 프리미엄 통계 대시보드 (재설계 완료)
│   │   ├── my-page.html            # 마이페이지
│   │   └── [9개 추가 페이지]        # 기타 기능 페이지들
│   ├── 🎨 스타일 및 에셋
│   │   ├── style.css               # 통합 스타일시트
│   │   ├── icons/                  # PWA 아이콘들
│   │   ├── manifest.json           # PWA 매니페스트
│   │   └── sw.js                   # 서비스 워커
│   ├── 🧪 백업 및 테스트
│   │   └── backup/                 # 개발 중 백업 파일들
│   └── 💻 JavaScript 모듈들 (16개)
│       ├── supabase.js             # Supabase 클라이언트
│       ├── auth.js                 # 인증 관리
│       ├── anonymous-community.js  # 익명 커뮤니티 (714줄)
│       ├── safety-filter.js        # 자살 예방 안전 필터 시스템
│       ├── ai-dashboard.js         # AI 대시보드 및 통계 (597줄)
│       ├── enhanced-emotion.js     # 고급 감정 분석
│       ├── notification-system.js  # 실시간 알림
│       ├── offline-storage.js      # 오프라인 저장
│       └── [8개 추가 모듈]          # 기타 기능 모듈들
├── netlify/
│   └── functions/              # Serverless Functions (9개)
│       ├── anonymous-community.js  # 익명 커뮤니티 API
│       ├── advanced-emotion-analysis.js # 고급 감정 분석
│       ├── ai-chat-streaming.js    # AI 스트리밍 채팅 (안전 필터 포함)
│       ├── emotion-summary.js      # 감정 요약
│       ├── analyze-emotion.js      # 기본 감정 분석
│       ├── chat.js                 # 채팅 처리 (안전 필터 포함)
│       ├── feedback.js             # 피드백 시스템
│       ├── delete-user.js          # 계정 삭제
│       └── voice-to-text.js        # 음성-텍스트 변환
├── 📋 설정 파일들
│   ├── package.json            # 의존성 관리
│   ├── netlify.toml           # Netlify 배포 설정
│   ├── _redirects             # 리다이렉트 규칙
│   └── .gitignore             # Git 제외 파일
└── server/                     # Legacy Express 서버 (미사용)
```

### 🔢 프로젝트 규모 통계
- **총 HTML 페이지**: 19개
- **JavaScript 모듈**: 16개 (약 3,500줄)
- **Netlify Functions**: 9개
- **Supabase 테이블**: 18개
- **총 일기 수**: 285개
- **총 프로젝트 파일**: 50개 이상

## 🗄️ 데이터베이스 스키마 (Supabase)

### Supabase 프로젝트 정보
- **프로젝트 ID**: vzmvgyxsscfyflgxcpnq
- **프로젝트명**: finalEmotion
- **URL**: https://vzmvgyxsscfyflgxcpnq.supabase.co
- **총 테이블 수**: 18개
- **RLS 정책**: 대부분의 테이블에 적용

### 핵심 테이블 (18개)
1. **diaries** - 일기 데이터 (285개 일기, RLS 활성화)
   - `emotion` 컬럼: CHECK 제약조건으로 5개 감정 허용
   - 허용 감정: happy, sad, angry, anxious, neutral

2. **chat_history** - AI 채팅 기록 (6개)
3. **shared_diaries** - 공유 일기 (RLS 활성화)
4. **notifications** - 실시간 알림 (RLS 활성화)
5. **subscriptions** - 구독 관리 (RLS 활성화)
6. **emotion_embeddings** - 감정 벡터 임베딩 (pgvector)
7. **ai_analysis_cache** - AI 분석 캐시
8. **emotion_patterns** - 감정 패턴 분석
9. **ai_recommendations** - AI 추천 시스템
10. **conversation_contexts** - 대화 컨텍스트
11. **multimodal_attachments** - 멀티모달 첨부파일 (RLS 활성화)
12. **emotion_predictions** - 감정 예측 (RLS 활성화)
13. **anonymous_posts** - 익명 게시글 (RLS 활성화)
14. **anonymous_comments** - 익명 댓글 (RLS 활성화)
15. **expert_profiles** - 전문가 프로필 (RLS 활성화)
16. **expert_consultations** - 전문가 상담 (RLS 활성화)
17. **analysis_metrics** - 분석 지표 (RLS 활성화)
18. **ai_personalization** - AI 개인화 설정 (RLS 활성화)

## 🔄 핵심 기능 플로우

### 1. 기본 일기 작성 및 감정 분석
```
1. 사용자 텍스트 일기 입력
2. 5개 감정 중 수동 선택 또는 자동 분석
   - happy (😊 행복)
   - sad (😢 슬픔)
   - angry (😠 분노)
   - anxious (😟 불안)
   - neutral (😐 보통)
3. analyze-emotion.js Function 호출
4. GPT-4o mini 감정 분석:
   - 5개 감정 중 하나로 분류
   - 감정 강도 점수 계산
   - AI 피드백 생성
5. 결과 저장 및 시각화
```

### 2. 안전 필터링 시스템
```
1. 사용자 메시지/일기 입력
2. 클라이언트 측 키워드 사전 검사 (safety-filter.js)
3. 위험 감지 시 즉시 안전 응답
4. 서버 측 이중 검증 (chat.js, ai-chat-streaming.js)
5. 자살예방상담전화 109번 안내
6. 전문가 상담 연결
```

### 3. AI 상담 시스템
```
1. 일기 내용 기반 상담 시작
2. 대화형 AI 상담 진행
3. 실시간 안전 모니터링
4. 위기 상황 자동 감지
5. 즉시 전문 도움 연결
```

### 4. 익명 커뮤니티
```
1. 사용자 ID → SHA-256 해싱
2. 고정 익명 ID 생성
3. 감정 기반 게시글 작성
4. 익명 댓글 및 공감
5. 안전한 감정 공유
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
# 프로젝트 디렉토리
cd /Users/dev/newEmotionProject

# Netlify CLI로 로컬 개발 서버 실행
npm run dev
# → http://localhost:8888

# 의존성 설치 (1359개 패키지)
npm install

# 함수 테스트
netlify functions:invoke analyze-emotion --payload '{"content":"오늘 정말 행복했어요"}'
```

## 🔐 보안 및 인증

### 현재 구현
- Supabase Auth 기반 인증
- JWT 토큰 검증 (모든 Netlify Functions)
- RLS(Row Level Security) 정책 (18개 테이블 중 대부분)
- 익명 ID 암호화 (SHA-256)

### 주의사항
- 인증 토큰: `session.access_token` 사용 (localStorage 대신)
- 모든 API 호출에 Bearer 토큰 포함
- 민감한 데이터 클라이언트 노출 금지

## 📊 감정 분류 체계 (5개 핵심 감정)

**중요**: 이 프로젝트는 **5개 감정만 사용**합니다.

### 감정 목록
1. **happy** (😊 행복) - `#10B981` (green-500)
2. **sad** (😢 슬픔) - `#3B82F6` (blue-500)
3. **angry** (😠 분노) - `#EF4444` (red-500)
4. **anxious** (😟 불안) - `#F59E0B` (amber-500)
5. **neutral** (😐 보통) - `#6B7280` (gray-500)

### 데이터베이스 제약조건
```sql
-- diaries 테이블의 emotion 컬럼
CHECK (emotion = ANY (ARRAY[
  'happy'::text,
  'sad'::text,
  'angry'::text,
  'anxious'::text,
  'neutral'::text,
  'excited'::text,    -- 레거시 (사용 안 함)
  'peaceful'::text,   -- 레거시 (사용 안 함)
  'confused'::text    -- 레거시 (사용 안 함)
]))
```

실제로는 5개 감정만 사용하지만, DB 제약조건은 8개를 허용합니다 (하위 호환성).

## 🎨 UI/UX 개선사항

### Phase 2 디자인 변경
1. **네비게이션**: 하단 바 제거, 상단 네비게이션으로 통일
2. **색상 팔레트**: 그라데이션 강조 (#667eea → #764ba2)
3. **반응형**: 모바일 최적화 완료
4. **접근성**: WCAG 2.1 AA 준수

### 통계 대시보드 (2025년 12월 최종 재설계)
- **프리미엄 비주얼 디자인**: 9개 신규 통계 카드
- **애니메이션 라이브러리**: Chart.js 4.4.0, Anime.js 3.2.1, CountUp.js 2.8.0, Particles.js 2.0.0
- **신규 통계 카드**:
  1. 연속 작성일 (Streak) 카드
  2. 감정 다양성 점수
  3. 28일 캘린더 히트맵
  4. 감정 강도 게이지
  5. 최근 5일 감정 타임라인
  6. 3D 감정 키워드 클라우드
  7. 시간대별 감정 패턴 (Y축 -10~+10 최적화)
  8. 요일별 감정 분석 (R축 -10~+10 최적화)
  9. 감정 변화 추세 및 분포
- **배경 효과**: Particles.js 배경 애니메이션 (모바일에서는 비활성화)

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

### 2025년 12월 Phase 2 최종 업데이트

#### 1. **Stats.html 프리미엄 대시보드 완전 재설계** ✅ 완료 (2025-12-18)
   - **요청**: 빈약한 통계 페이지를 시각적이고 동적이고 화려하게 개선
   - **추가된 라이브러리**:
     - Chart.js 4.4.0 (정확한 버전 지정으로 source map 404 해결)
     - Anime.js 3.2.1 (부드러운 애니메이션)
     - CountUp.js 2.8.0 (숫자 카운터 애니메이션)
     - Particles.js 2.0.0 (배경 파티클 효과)
   - **신규 기능 구현**:
     - `calculateStreak()`: 연속 작성일 계산
     - `generateCalendarHeatmap()`: 28일 히트맵
     - `generateEmotionTimeline()`: 최근 5일 타임라인
     - `generateEmotionCloud()`: 키워드 빈도 기반 클라우드
     - `animateCounter()`: 부드러운 숫자 카운터
   - **차트 최적화**:
     - 시간대별 감정 패턴: Y축 범위 -100~100 → -10~+10
     - 요일별 감정 분석: R축 범위 -100~100 → -10~+10
     - 호버 시 차트 사라짐 문제 해결 (pulse-on-hover 제거)
   - **CSS 개선**:
     - 900+ 라인의 신규 CSS 추가
     - CSS Grid 기반 반응형 레이아웃
     - Stagger 애니메이션 효과
     - 모던한 그라데이션 스타일
   - **결과**: 엔터프라이즈급 프리미엄 통계 대시보드 완성

#### 2. **Dashboard.html 시인성 개선** ✅ 완료
   - **문제**: 멀티모달 AI 분석 섹션에서 흰색 텍스트가 배경 없이 표시되어 가독성 저하
   - **해결**: `bg-gradient-to-br from-blue-500 to-purple-600` 그라데이션 배경 적용
   - **추가 수정**: Phase 2 기능 카드들의 호버 효과에서 배경 색상이 사라지는 문제
   - **해결**: `.emotion-card` CSS 클래스 제거하고 Tailwind 유틸리티 클래스로 대체

#### 3. **로컬 개발 환경 구축** ✅ 완료
   - **문제**: `npm run dev` 실행 시 "netlify command not found" 오류
   - **해결**: `npm install` 실행하여 1359개 패키지 설치 (netlify-cli 포함)
   - **결과**: 로컬 개발 서버 `http://localhost:8888` 정상 동작

#### 4. **Write-diary.html 기능 복구** ✅ 완료
   - **문제**: 감정 자동 분석 버튼 500 에러, 감정 버튼 비활성화, GPT 피드백 오류
   - **원인**: package.json의 `"type": "module"` 설정이 CommonJS 함수와 충돌
   - **해결**:
     - package.json에서 `"type": "module"` 제거
     - 감정 버튼 이벤트 핸들러 추가
     - OpenAI API 키 실제 키로 교체
   - **결과**: 모든 기능 정상 동작 확인

#### 5. **종합적 자살 예방 안전 시스템 구축** ✅ 완료
   - **목적**: "죽고 싶어", "자살할래" 등 위험 메시지 감지 및 전문 상담 안내
   - **구현 범위**: 모든 채팅 기능 (일반 채팅, 일기 기반 상담)
   - **핵심 컴포넌트**:
     - `safety-filter.js`: 클라이언트 측 안전 필터링 클래스
     - `chat.js`: 서버 측 안전 검증 강화
     - `ai-chat-streaming.js`: 스트리밍 채팅 안전 필터
   - **키워드 시스템**: 확장된 한국어 위험 표현 검출 (24개 키워드)
   - **응답 시스템**: 자살예방상담전화 109번 안내 및 즉시 전문 도움 연결
   - **다층 보안**: 클라이언트 + 서버 이중 검증으로 우회 방지

#### 6. **Write-diary.html 인터페이스 단순화** ✅ 완료
   - **요청**: 멀티모달 AI 탭과 감정 예측 탭 완전 제거, 기본 작성만 유지
   - **제거된 요소**:
     - 탭 네비게이션 시스템
     - 멀티모달 AI 분석 탭 전체
     - 감정 예측 탭 전체
   - **삭제된 파일**:
     - `multimodal-diary.js` (639줄)
     - `emotion-prediction.js` (655줄)
     - `multimodal-analysis.js` (Netlify Function)
     - `emotion-prediction.js` (Netlify Function)
   - **결과**: 깔끔한 단일 일기 작성 인터페이스로 전환

### 2025년 9월 이전 업데이트
1. **네비게이션 및 UI 통일성 완성**
   - 모든 19개 페이지 상단 네비게이션으로 통일
   - 반응형 디자인 최적화 완료
   - 일관된 색상 팔레트 적용

2. **Netlify Functions 배포 최적화**
   - 9개 서버리스 함수 안정화
   - CORS 및 환경변수 설정 완료
   - 에러 핸들링 및 로깅 개선

## 📈 성능 최적화

### 구현된 최적화
- API 호출 병렬 처리
- 캐싱 전략 (15분 TTL)
- 지연 로딩 적용
- 애니메이션 성능 최적화 (모바일 파티클 비활성화)

### 권장 사항
- 일기 텍스트: 최대 5000자
- 이미지 업로드: 지원하지 않음 (단순화됨)
- 음성 녹음: 지원하지 않음 (단순화됨)

## 🔮 향후 계획 (Phase 3)

1. **PWA 강화**: 완전한 오프라인 지원
2. **실시간 기능**: WebSocket 기반 실시간 알림
3. **AI 고도화**: 더 정교한 감정 분석
4. **국제화**: 다국어 지원 (영어, 일본어)
5. **모바일 앱**: React Native 개발

## 💡 개발 시 주의사항

### 1. 감정 시스템
```javascript
// ✅ 올바른 방법: 5개 감정만 사용
const EMOTIONS = ['happy', 'sad', 'angry', 'anxious', 'neutral'];

// ❌ 잘못된 방법: 24개 감정 사용 금지
// 이 프로젝트는 5개 감정만 지원합니다
```

### 2. 인증 토큰 관리
```javascript
// ✅ 올바른 방법
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// ❌ 잘못된 방법 (사용 금지)
const token = localStorage.getItem('supabase.auth.token');
```

### 3. 익명 ID 생성
```javascript
// 일관된 해싱 알고리즘 사용
// Salt 값 고정: 'anonymous_salt_2025'
```

### 4. API 비용 관리
- OpenAI API 토큰 사용량 모니터링
- 로컬 개발 시 캐싱 활용

## 📞 문제 해결 연락처

- GitHub Issues: [프로젝트 저장소]/issues
- 개발자 문서: https://docs.anthropic.com/claude-code

## 🚀 프로젝트 완성도 및 성취사항

### ✅ 완료된 주요 기능들
1. **핵심 일기 작성 시스템** (100% 완성)
   - 깔끔한 텍스트 기반 일기 작성
   - GPT-4o mini 감정 분석
   - **5개 핵심 감정 시스템**
   - 직관적인 단일 인터페이스

2. **종합적 안전 관리 시스템** (100% 완성)
   - 자살 예방 안전 필터링
   - 클라이언트 + 서버 이중 검증
   - 24가지 위험 키워드 감지
   - 자살예방상담전화 즉시 연결

3. **AI 상담 및 분석** (100% 완성)
   - 일기 기반 개인화 상담
   - 실시간 채팅 상담
   - **프리미엄 AI 대시보드 및 통계 시각화**
   - 위기 상황 즉시 감지

4. **커뮤니티 기능** (100% 완성)
   - 익명 감정 공유 시스템
   - 안전한 익명 ID 시스템
   - 감정 기반 소통 플랫폼

5. **PWA 및 UX** (100% 완성)
   - 프로그레시브 웹 앱
   - 완전 반응형 디자인
   - 통일된 네비게이션 시스템
   - **엔터프라이즈급 통계 대시보드**

### 🎯 기술적 성취
- **확장성**: 서버리스 아키텍처로 무제한 확장 가능
- **성능**: 최적화된 코드와 캐싱 전략, 애니메이션 최적화
- **보안**: JWT 토큰, RLS 정책, CORS 설정
- **사용성**: 직관적인 UI/UX, PWA 지원, 프리미엄 비주얼

### 💡 비즈니스 가치
- **즉시 상용화 가능**: 완성된 감정 분석 서비스
- **AI 기반 안전성**: 종합적 자살 예방 시스템으로 사용자 보호
- **사용자 중심**: 익명성과 개인정보 보호 완비
- **확장 가능**: 추가 기능 개발 기반 마련
- **사회적 가치**: 정신건강 케어 및 위기 개입 시스템

## 🎯 현재 개발 환경 및 운영 상태

### 로컬 개발 환경
```bash
# 프로젝트 디렉토리
cd /Users/dev/newEmotionProject

# 로컬 개발 서버 실행
npm run dev
# → http://localhost:8888

# 의존성 설치 완료
npm install  # 1359개 패키지 설치 완료
```

### 프로덕션 배포
- **배포 URL**: https://healing-diary.netlify.app
- **자동 배포**: GitHub main 브랜치 푸시 시
- **환경 변수**: Netlify 대시보드에서 관리

## 📝 최신 개발 진행 상황 요약 (2025년 12월)

### 🎯 주요 달성 사항
1. **UI/UX 혁신적 개선 완료**
   - Stats.html 프리미엄 대시보드 완전 재설계
   - 9개 신규 인터랙티브 통계 카드 추가
   - 엔터프라이즈급 비주얼 디자인 구현
   - Dashboard.html 시인성 문제 완전 해결

2. **개발 환경 최적화**
   - 로컬 개발 워크플로우 구축
   - 실시간 테스트 환경 구성
   - npm run dev 안정화

3. **핵심 기능 단순화**
   - Write-diary.html 멀티모달 기능 제거
   - **5개 핵심 감정 시스템으로 통일**
   - 깔끔한 단일 일기 작성 인터페이스 완성

4. **안전 시스템 구축**
   - 종합적 자살 예방 필터링 시스템
   - 다층 보안 (클라이언트 + 서버)
   - 위기 상황 즉시 대응 체계

### 🔧 기술적 개선 사항
- **파일 정리**: 미사용 모듈 및 함수 제거 (2개 삭제)
- **코드 최적화**: CommonJS 호환성 문제 해결
- **API 연동**: OpenAI API 실제 키 적용
- **CSS 재설계**: 현대적 Grid 레이아웃 + 900줄 신규 CSS
- **차트 최적화**: Y축/R축 범위 최적화 (-10~+10)

### 📊 현재 프로젝트 구성 (정확한 통계)
- **HTML 페이지**: 19개
- **JavaScript 모듈**: 16개
- **Netlify Functions**: 9개
- **Supabase 테이블**: 18개
- **총 일기 수**: 285개
- **핵심 안전 시스템**: 완전 구축

### 🎨 최신 기술 스택
- **Chart.js**: 4.4.0 (정확한 버전)
- **Anime.js**: 3.2.1 (애니메이션)
- **CountUp.js**: 2.8.0 (카운터)
- **Particles.js**: 2.0.0 (배경 효과)
- **Supabase JS**: 2.49.4
- **OpenAI**: 4.0.0

## 🚀 다음 개발 방향성

### 우선순위 높은 개선사항
1. **성능 최적화**
   - API 응답 시간 개선
   - 캐싱 전략 강화
   - 차트 렌더링 최적화

2. **사용자 경험 개선**
   - 로딩 상태 시각화
   - 오류 메시지 개선
   - 접근성 강화

3. **기능 확장**
   - 일기 검색 기능
   - 감정 통계 고도화
   - 개인화 추천 시스템

### 장기 로드맵
1. **모바일 최적화**: PWA 기능 강화
2. **AI 고도화**: GPT-4 전면 도입
3. **실시간 기능**: WebSocket 기반 알림
4. **국제화**: 다국어 지원

## 🛠️ 개발자를 위한 핵심 가이드

### 중요한 파일들
```
/public/
├── dashboard.html          # 메인 대시보드 (시인성 개선 완료)
├── write-diary.html        # 일기 작성 (5개 감정 시스템)
├── stats.html             # 프리미엄 통계 (2045줄, 재설계 완료)
├── chat.html              # AI 상담 (안전 필터 적용)
└── js/
    ├── safety-filter.js   # 안전 필터링 시스템
    └── ai-dashboard.js    # 통계 대시보드 (597줄)

/netlify/functions/
├── chat.js                # 채팅 API (안전 필터 포함)
├── ai-chat-streaming.js   # 스트리밍 상담 (안전 필터 포함)
└── analyze-emotion.js     # 감정 분석 API (5개 감정)
```

### 개발 시 주의사항
1. **감정 시스템**: **5개 감정만 사용** (happy, sad, angry, anxious, neutral)
2. **안전 필터**: 모든 사용자 입력에 안전 검증 적용
3. **API 키 관리**: 환경 변수로 안전하게 관리
4. **에러 처리**: 사용자 친화적 에러 메시지 제공
5. **테스트**: 로컬 환경에서 충분히 테스트 후 배포

### 디버깅 가이드
```bash
# 로컬 개발 서버 확인
netlify dev

# 함수 단독 테스트
netlify functions:invoke analyze-emotion --payload '{"content":"오늘 너무 행복했어요"}'

# 함수 단독 테스트 (채팅)
netlify functions:invoke chat --payload '{"message":"안녕하세요"}'
```

---

*최종 업데이트: 2025년 12월 18일*
*프로젝트 상태: Phase 2 완성 + 프리미엄 통계 대시보드 완성*
*감정 시스템: 5개 핵심 감정 (happy, sad, angry, anxious, neutral)*
*개발 환경: 로컬 테스트 환경 구축 완료*
*작성자: Claude Code Assistant*
