// 향상된 감정 분석 기능
import { offlineStorage } from './offline-storage.js';

export class EnhancedEmotion {
  constructor() {
    this.emotions = {
      happy: {
        label: '😊 행복',
        color: '#74c0fc',
        intensity: ['기쁨', '만족', '환희', '행복'],
        keywords: ['기쁘', '행복', '좋', '웃', '즐거', '신나', '만족', '뿌듯']
      },
      sad: {
        label: '😢 슬픔',
        color: '#ff8787',
        intensity: ['아쉬움', '실망', '슬픔', '절망'],
        keywords: ['슬프', '우울', '아쉽', '실망', '허탈', '외로', '눈물']
      },
      angry: {
        label: '😠 분노',
        color: '#ffa94d',
        intensity: ['짜증', '화남', '분노', '격노'],
        keywords: ['화나', '짜증', '분노', '열받', '빡치', '성질', '억울']
      },
      anxious: {
        label: '😟 불안',
        color: '#ffd43b',
        intensity: ['걱정', '불안', '초조', '공포'],
        keywords: ['불안', '걱정', '무서', '두려', '초조', '긴장', '스트레스']
      },
      neutral: {
        label: '😐 보통',
        color: '#ced4da',
        intensity: ['평온', '보통', '무덤덤', '정적'],
        keywords: ['평범', '보통', '그냥', '무난', '평온', '조용']
      },
      excited: {
        label: '🤩 신남',
        color: '#ff6b9d',
        intensity: ['관심', '흥미', '신남', '흥분'],
        keywords: ['신나', '흥미', '재미', '멋지', '와우', '대박', '최고']
      },
      peaceful: {
        label: '😌 평온',
        color: '#51cf66',
        intensity: ['차분', '평온', '안정', '고요'],
        keywords: ['차분', '평온', '고요', '조용', '편안', '안정', '여유']
      },
      confused: {
        label: '😕 혼란',
        color: '#9775fa',
        intensity: ['의문', '혼란', '갈등', '복잡'],
        keywords: ['헷갈', '혼란', '복잡', '모르겠', '갈등', '애매', '의문']
      }
    };
  }

  // 확장된 감정 분석 (키워드 기반 + AI)
  async analyzeEmotion(content, useAI = true) {
    // 1. 오프라인 캐시 확인
    const cachedEmotion = await offlineStorage.getCachedEmotion(content);
    if (cachedEmotion) {
      return {
        emotion: cachedEmotion,
        confidence: 0.8,
        method: 'cache',
        intensity: this.getEmotionIntensity(content, cachedEmotion)
      };
    }

    // 2. 키워드 기반 분석
    const keywordResult = this.analyzeByKeywords(content);

    // 3. AI 분석 (온라인 상태에서만)
    if (useAI && navigator.onLine) {
      try {
        const aiResult = await this.analyzeByAI(content);

        // AI 결과와 키워드 결과 결합
        const finalEmotion = this.combineResults(keywordResult, aiResult);

        // 결과 캐시
        await offlineStorage.cacheEmotionAnalysis(content, finalEmotion.emotion);

        return finalEmotion;
      } catch (error) {
        console.log('AI 분석 실패, 키워드 분석 사용:', error);
        return keywordResult;
      }
    }

    return keywordResult;
  }

  // 키워드 기반 감정 분석
  analyzeByKeywords(content) {
    const text = content.toLowerCase();
    const scores = {};

    // 각 감정별 키워드 매칭
    Object.entries(this.emotions).forEach(([emotion, data]) => {
      scores[emotion] = 0;
      data.keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'g');
        const matches = text.match(regex);
        if (matches) {
          scores[emotion] += matches.length;
        }
      });
    });

    // 최고 점수 감정 선택
    const maxEmotion = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    );

    return {
      emotion: maxEmotion || 'neutral',
      confidence: Math.min(scores[maxEmotion] / 3, 1),
      method: 'keywords',
      intensity: this.getEmotionIntensity(content, maxEmotion),
      breakdown: scores
    };
  }

  // AI 감정 분석
  async analyzeByAI(content) {
    const response = await fetch('/.netlify/functions/analyze-emotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    const data = await response.json();

    return {
      emotion: data.emotion,
      confidence: 0.9,
      method: 'ai',
      intensity: this.getEmotionIntensity(content, data.emotion)
    };
  }

  // 결과 결합 (AI 우선, 키워드 보조)
  combineResults(keywordResult, aiResult) {
    // AI 결과를 우선하되, 키워드 결과로 보정
    const confidence = keywordResult.confidence > 0.5 &&
                     keywordResult.emotion === aiResult.emotion ?
                     Math.min(aiResult.confidence + 0.1, 1.0) :
                     aiResult.confidence;

    return {
      emotion: aiResult.emotion,
      confidence,
      method: 'combined',
      intensity: aiResult.intensity,
      breakdown: keywordResult.breakdown
    };
  }

  // 감정 강도 계산
  getEmotionIntensity(content, emotion) {
    const text = content.toLowerCase();
    const length = content.length;

    // 강조 표현 감지
    const emphasisCount = (text.match(/[!]{2,}|[?]{2,}|[.]{3,}/g) || []).length;
    const capsCount = (content.match(/[A-Z]{2,}/g) || []).length;

    // 기본 강도 (0-3)
    let intensity = 1;

    // 텍스트 길이에 따른 강도 조정
    if (length > 500) intensity += 1;
    if (length > 1000) intensity += 1;

    // 강조 표현에 따른 강도 조정
    if (emphasisCount > 0) intensity += Math.min(emphasisCount, 2);
    if (capsCount > 0) intensity += 1;

    return Math.min(Math.max(intensity, 0), 3);
  }

  // 감정 설명 생성
  getEmotionDescription(emotion, intensity) {
    const emotionData = this.emotions[emotion];
    if (!emotionData) return '알 수 없는 감정';

    const intensityLabel = emotionData.intensity[intensity] || emotionData.intensity[1];
    return `${emotionData.label} (${intensityLabel})`;
  }

  // 감정별 추천 활동
  getRecommendedActivities(emotion, intensity) {
    const activities = {
      happy: [
        '좋은 순간을 사진으로 남겨보세요',
        '감사 일기를 써보세요',
        '친구나 가족과 이 기쁨을 나누어보세요',
        '새로운 취미에 도전해보세요'
      ],
      sad: [
        '따뜻한 차 한 잔을 마시며 휴식을 취하세요',
        '좋아하는 영화나 책을 즐겨보세요',
        '산책이나 가벼운 운동을 해보세요',
        '신뢰하는 사람과 대화해보세요'
      ],
      angry: [
        '깊게 숨을 들이쉬고 내쉬어보세요',
        '운동으로 에너지를 발산해보세요',
        '문제 해결책을 차근차근 생각해보세요',
        '잠시 시간을 두고 마음을 가라앉혀보세요'
      ],
      anxious: [
        '명상이나 요가를 시도해보세요',
        '할 일을 작은 단위로 나누어 정리해보세요',
        '자연 속에서 시간을 보내보세요',
        '전문가의 도움을 받는 것도 좋습니다'
      ],
      neutral: [
        '새로운 것을 배우거나 시도해보세요',
        '미래 계획을 세워보세요',
        '평소 미뤄왔던 일을 정리해보세요',
        '자기 성찰의 시간을 가져보세요'
      ]
    };

    return activities[emotion] || activities.neutral;
  }

  // 감정 통계 계산
  calculateEmotionStats(diaryEntries) {
    const stats = {
      total: diaryEntries.length,
      emotions: {},
      trends: {},
      averageIntensity: 0
    };

    // 감정별 카운트
    Object.keys(this.emotions).forEach(emotion => {
      stats.emotions[emotion] = 0;
    });

    diaryEntries.forEach(entry => {
      if (stats.emotions[entry.emotion] !== undefined) {
        stats.emotions[entry.emotion]++;
      }
    });

    // 최근 7일 트렌드
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEntries = diaryEntries.filter(entry =>
      new Date(entry.created_at) >= weekAgo
    );

    stats.trends.recent = recentEntries.length;
    stats.trends.improvement = this.calculateImprovementTrend(recentEntries);

    return stats;
  }

  // 개선 트렌드 계산
  calculateImprovementTrend(entries) {
    if (entries.length < 2) return 0;

    const emotionScores = {
      happy: 2, excited: 2, peaceful: 1,
      neutral: 0,
      confused: -0.5, anxious: -1, sad: -1, angry: -2
    };

    const scores = entries.map(entry => emotionScores[entry.emotion] || 0);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }
}