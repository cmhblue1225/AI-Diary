import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bXZneXhzc2NmeWZsZ3hjcG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDI4NzgsImV4cCI6MjA1OTk3ODg3OH0.-hQSBKVvPUX_KpbOp0zT25xMEjmky3WR-STC06kP0n4'
);

// 사용자의 과거 감정 패턴 분석
async function getUserEmotionHistory(userId, days = 30) {
  try {
    const { data: diaries } = await supabase
      .from('diaries')
      .select('emotion, mood_score, created_at, keywords, complexity_score')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!diaries || diaries.length === 0) {
      return { emotions: [], patterns: {}, statistics: {} };
    }

    // 감정 빈도 분석
    const emotionCounts = diaries.reduce((acc, diary) => {
      acc[diary.emotion] = (acc[diary.emotion] || 0) + 1;
      return acc;
    }, {});

    // 요일별 패턴 분석
    const dayPatterns = diaries.reduce((acc, diary) => {
      const dayOfWeek = new Date(diary.created_at).getDay();
      if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
      acc[dayOfWeek].push({
        emotion: diary.emotion,
        mood_score: diary.mood_score
      });
      return acc;
    }, {});

    // 시간 흐름에 따른 변화
    const emotionTrend = diaries.map((diary, index) => ({
      date: diary.created_at,
      emotion: diary.emotion,
      mood_score: diary.mood_score,
      sequence: index
    }));

    // 기분 점수 통계
    const moodScores = diaries.filter(d => d.mood_score !== null).map(d => d.mood_score);
    const avgMoodScore = moodScores.length > 0
      ? moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
      : 0;

    return {
      emotions: diaries,
      patterns: {
        emotion_frequency: emotionCounts,
        day_patterns: dayPatterns,
        emotion_trend: emotionTrend
      },
      statistics: {
        total_entries: diaries.length,
        avg_mood_score: avgMoodScore,
        mood_variance: moodScores.length > 1
          ? moodScores.reduce((sum, score) => sum + Math.pow(score - avgMoodScore, 2), 0) / (moodScores.length - 1)
          : 0,
        most_common_emotion: Object.keys(emotionCounts).reduce((a, b) =>
          emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'),
        emotional_stability: Math.max(0, 100 - (moodScores.length > 1
          ? Math.sqrt(moodScores.reduce((sum, score) => sum + Math.pow(score - avgMoodScore, 2), 0) / (moodScores.length - 1))
          : 0))
      }
    };
  } catch (error) {
    console.error('감정 히스토리 조회 오류:', error);
    return { emotions: [], patterns: {}, statistics: {} };
  }
}

// AI 기반 감정 예측 모델
async function predictEmotionWithAI(emotionHistory, targetDays = 7) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 감정 패턴 분석 및 예측 전문가입니다. 사용자의 과거 감정 데이터를 바탕으로 향후 ${targetDays}일간의 감정 상태를 예측해주세요.

다음 요소들을 고려하여 분석하세요:
1. 감정 패턴의 주기성 (요일별, 시간대별)
2. 기분 점수의 변화 추세
3. 감정 안정성 및 변동성
4. 외부 요인 가능성 (계절, 스트레스 등)
5. 개인의 감정 회복 패턴

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "predictions": [
    {
      "date": "2025-01-20",
      "predicted_emotion": "emotion_key",
      "predicted_mood_score": 45,
      "confidence_level": 0.75,
      "factors": ["요인1", "요인2"],
      "risk_level": "low"
    }
  ],
  "pattern_analysis": {
    "dominant_cycle": "weekly",
    "emotional_trend": "improving",
    "stability_score": 0.8,
    "volatility_index": 0.3
  },
  "recommendations": {
    "high_risk_days": ["2025-01-22"],
    "preventive_actions": ["예방 조치들"],
    "positive_activities": ["긍정적 활동들"],
    "support_needed": false
  },
  "model_insights": "예측 모델의 핵심 인사이트",
  "confidence_explanation": "예측 신뢰도에 대한 설명"
}`
          },
          {
            role: 'user',
            content: `사용자 감정 히스토리:

전체 통계:
- 총 일기 수: ${emotionHistory.statistics.total_entries}
- 평균 기분 점수: ${emotionHistory.statistics.avg_mood_score}
- 감정 안정성: ${emotionHistory.statistics.emotional_stability}
- 주요 감정: ${emotionHistory.statistics.most_common_emotion}

감정 빈도:
${JSON.stringify(emotionHistory.patterns.emotion_frequency, null, 2)}

요일별 패턴:
${JSON.stringify(emotionHistory.patterns.day_patterns, null, 2)}

최근 감정 변화:
${JSON.stringify(emotionHistory.patterns.emotion_trend.slice(-14), null, 2)}

위 데이터를 바탕으로 향후 ${targetDays}일간의 감정 상태를 예측해주세요.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 API 오류');
    }

    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('AI 감정 예측 오류:', error);
    return null;
  }
}

// 예측 정확도 계산 및 모델 개선
async function validatePredictionAccuracy(userId) {
  try {
    // 과거 예측들과 실제 결과 비교
    const { data: pastPredictions } = await supabase
      .from('emotion_predictions')
      .select('*')
      .eq('user_id', userId)
      .not('actual_emotion', 'is', null)
      .gte('prediction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!pastPredictions || pastPredictions.length === 0) {
      return { accuracy: 0, sample_size: 0 };
    }

    let correctPredictions = 0;
    let totalMoodScoreError = 0;

    pastPredictions.forEach(prediction => {
      // 감정 정확도 (정확히 일치)
      if (prediction.predicted_emotion === prediction.actual_emotion) {
        correctPredictions++;
      }

      // 기분 점수 오차 계산
      if (prediction.predicted_mood_score && prediction.actual_mood_score) {
        totalMoodScoreError += Math.abs(prediction.predicted_mood_score - prediction.actual_mood_score);
      }
    });

    const emotionAccuracy = correctPredictions / pastPredictions.length;
    const avgMoodScoreError = totalMoodScoreError / pastPredictions.length;

    // 종합 정확도 계산
    const overallAccuracy = emotionAccuracy * 0.7 + Math.max(0, (100 - avgMoodScoreError) / 100) * 0.3;

    await supabase
      .from('analysis_metrics')
      .insert({
        user_id: userId,
        analysis_type: 'emotion_prediction',
        confidence_score: overallAccuracy,
        success_rate: emotionAccuracy,
        model_version: 'gpt-4o-mini-prediction-v1'
      });

    return {
      accuracy: overallAccuracy,
      emotion_accuracy: emotionAccuracy,
      avg_mood_error: avgMoodScoreError,
      sample_size: pastPredictions.length
    };
  } catch (error) {
    console.error('예측 정확도 검증 오류:', error);
    return { accuracy: 0, sample_size: 0 };
  }
}

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const startTime = Date.now();

  try {
    // 인증 확인
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '인증이 필요합니다.' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '유효하지 않은 토큰입니다.' })
      };
    }

    if (event.httpMethod === 'GET') {
      // 기존 예측 조회
      const { data: existingPredictions } = await supabase
        .from('emotion_predictions')
        .select('*')
        .eq('user_id', user.id)
        .gte('prediction_date', new Date().toISOString().split('T')[0])
        .order('prediction_date', { ascending: true });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          predictions: existingPredictions || [],
          has_predictions: existingPredictions && existingPredictions.length > 0
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const { action = 'predict', targetDays = 7, validationMode = false } = JSON.parse(event.body || '{}');

      if (action === 'validate') {
        // 예측 정확도 검증
        const accuracy = await validatePredictionAccuracy(user.id);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(accuracy)
        };
      }

      // 감정 히스토리 조회
      const emotionHistory = await getUserEmotionHistory(user.id, 30);

      if (emotionHistory.statistics.total_entries < 3) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: '예측을 위해 최소 3개 이상의 일기가 필요합니다.',
            current_entries: emotionHistory.statistics.total_entries,
            required_entries: 3
          })
        };
      }

      // AI 기반 예측 생성
      const prediction = await predictEmotionWithAI(emotionHistory, targetDays);

      if (!prediction) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'AI 예측 생성에 실패했습니다.' })
        };
      }

      // 예측 결과 저장
      const predictionInserts = prediction.predictions.map(pred => ({
        user_id: user.id,
        prediction_date: pred.date,
        predicted_emotion: pred.predicted_emotion,
        predicted_mood_score: pred.predicted_mood_score,
        confidence_level: pred.confidence_level,
        prediction_factors: {
          factors: pred.factors,
          risk_level: pred.risk_level,
          pattern_analysis: prediction.pattern_analysis,
          recommendations: prediction.recommendations
        }
      }));

      const { data: insertedPredictions, error: insertError } = await supabase
        .from('emotion_predictions')
        .upsert(predictionInserts, {
          onConflict: 'user_id,prediction_date',
          ignoreDuplicates: false
        })
        .select();

      if (insertError) {
        console.error('예측 저장 오류:', insertError);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          predictions: prediction.predictions,
          pattern_analysis: prediction.pattern_analysis,
          recommendations: prediction.recommendations,
          model_insights: prediction.model_insights,
          confidence_explanation: prediction.confidence_explanation,
          historical_accuracy: await validatePredictionAccuracy(user.id),
          processing_time: Date.now() - startTime,
          data_quality: {
            entries_used: emotionHistory.statistics.total_entries,
            emotional_stability: emotionHistory.statistics.emotional_stability,
            data_completeness: Math.min(100, (emotionHistory.statistics.total_entries / 30) * 100)
          }
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };

  } catch (error) {
    console.error('감정 예측 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '감정 예측 중 오류가 발생했습니다.',
        detail: error.message
      })
    };
  }
};