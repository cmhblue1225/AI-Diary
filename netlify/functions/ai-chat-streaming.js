import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bXZneXhzc2NmeWZsZ3hjcG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDI4NzgsImV4cCI6MjA1OTk3ODg3OH0.-hQSBKVvPUX_KpbOp0zT25xMEjmky3WR-STC06kP0n4'
);

// 사용자 대화 컨텍스트 가져오기
async function getConversationContext(userId, sessionId) {
  try {
    const { data } = await supabase
      .from('conversation_contexts')
      .select('context_data')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();

    return data?.context_data || { messages: [], emotion_state: 'neutral', conversation_depth: 0 };
  } catch (error) {
    return { messages: [], emotion_state: 'neutral', conversation_depth: 0 };
  }
}

// 대화 컨텍스트 업데이트
async function updateConversationContext(userId, sessionId, contextData) {
  try {
    await supabase
      .from('conversation_contexts')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        context_data: contextData,
        last_message_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후 만료
      }, {
        onConflict: 'user_id,session_id'
      });
  } catch (error) {
    console.error('컨텍스트 업데이트 실패:', error);
  }
}

// 사용자의 최근 감정 패턴 분석
async function getUserEmotionProfile(userId) {
  try {
    const { data: recentDiaries } = await supabase
      .from('diaries')
      .select('emotion, mood_score, ai_insights, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentDiaries || recentDiaries.length === 0) {
      return { primary_emotion: 'neutral', mood_trend: 0, needs_support: false };
    }

    const avgMoodScore = recentDiaries.reduce((sum, diary) => sum + (diary.mood_score || 0), 0) / recentDiaries.length;
    const emotionCounts = recentDiaries.reduce((acc, diary) => {
      acc[diary.emotion] = (acc[diary.emotion] || 0) + 1;
      return acc;
    }, {});

    const primaryEmotion = Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    return {
      primary_emotion: primaryEmotion,
      mood_trend: avgMoodScore,
      needs_support: avgMoodScore < -20 || ['sad', 'anxious', 'angry'].includes(primaryEmotion),
      recent_insights: recentDiaries.slice(0, 3).map(d => d.ai_insights).filter(Boolean)
    };
  } catch (error) {
    return { primary_emotion: 'neutral', mood_trend: 0, needs_support: false };
  }
}

// 개인화된 시스템 프롬프트 생성
function createPersonalizedSystemPrompt(emotionProfile, conversationDepth) {
  const basePrompt = `당신은 감정적으로 지지적이고 공감적인 AI 심리 상담사입니다. 사용자와의 대화에서 다음을 지켜주세요:

1. 공감과 이해를 우선시하며, 비판적이지 않은 태도
2. 구체적이고 실행 가능한 조언 제공
3. 필요시 전문적 도움 권유 (심각한 우울/불안 징후 시)
4. 따뜻하고 친근한 톤 유지
5. 50-100자 내외의 적절한 길이로 응답`;

  // 사용자의 감정 프로필에 따른 맞춤형 지침
  let personalizedGuidance = '';

  if (emotionProfile.needs_support) {
    personalizedGuidance += `\n\n현재 사용자는 어려운 시기를 보내고 있는 것 같습니다 (주요 감정: ${emotionProfile.primary_emotion}, 기분 점수: ${emotionProfile.mood_trend}).
특별히 따뜻한 지지와 격려가 필요합니다.`;
  }

  if (conversationDepth > 5) {
    personalizedGuidance += '\n이미 깊은 대화를 나누고 있으므로, 구체적인 해결책이나 다음 단계에 대해 제안해보세요.';
  }

  if (emotionProfile.recent_insights && emotionProfile.recent_insights.length > 0) {
    personalizedGuidance += `\n사용자의 최근 감정 인사이트: ${emotionProfile.recent_insights.join(', ')}`;
  }

  return basePrompt + personalizedGuidance;
}

// GPT-4o로 스트리밍 응답 생성
async function generateStreamingResponse(messages, systemPrompt) {
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
          { role: 'system', content: systemPrompt },
          ...messages.slice(-8) // 최근 8개 메시지만 유지 (토큰 절약)
        ],
        temperature: 0.7,
        max_tokens: 200,
        stream: false // Netlify Functions는 스트리밍 제한이 있어 일반 응답 사용
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT API 오류');
    }

    return result.choices[0].message.content;
  } catch (error) {
    console.error('GPT 응답 생성 실패:', error);
    return '죄송합니다. 현재 응답을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  }
}

// 응답 품질 평가 (간단한 휴리스틱)
function evaluateResponseQuality(response, userMessage) {
  let score = 3; // 기본 점수

  // 길이 체크
  if (response.length > 20 && response.length < 300) score += 1;

  // 공감/지지 표현 확인
  const empathyKeywords = ['이해', '공감', '힘들', '괜찮', '도움', '지지', '함께'];
  if (empathyKeywords.some(keyword => response.includes(keyword))) score += 1;

  // 질문이나 격려 포함 확인
  if (response.includes('?') || response.includes('!')) score += 0.5;

  return Math.min(score, 5);
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const startTime = Date.now();

  try {
    const { message, sessionId = 'default', diaryId } = JSON.parse(event.body || '{}');

    if (!message || !message.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '메시지가 필요합니다.' })
      };
    }

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

    // 사용자 감정 프로필 분석
    const emotionProfile = await getUserEmotionProfile(user.id);

    // 대화 컨텍스트 가져오기
    const context = await getConversationContext(user.id, sessionId);

    // 메시지 히스토리에 사용자 메시지 추가
    context.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // 개인화된 시스템 프롬프트 생성
    const systemPrompt = createPersonalizedSystemPrompt(emotionProfile, context.conversation_depth || 0);

    // AI 응답 생성
    const aiResponse = await generateStreamingResponse(context.messages, systemPrompt);

    // 응답 품질 평가
    const responseQuality = evaluateResponseQuality(aiResponse, message);

    // 컨텍스트에 AI 응답 추가
    context.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      quality_score: responseQuality
    });

    // 컨텍스트 업데이트 (최근 20개 메시지만 유지)
    context.messages = context.messages.slice(-20);
    context.conversation_depth = (context.conversation_depth || 0) + 1;
    context.emotion_state = emotionProfile.primary_emotion;

    await updateConversationContext(user.id, sessionId, context);

    // 채팅 히스토리에 저장
    const historyInserts = [
      {
        user_id: user.id,
        diary_id: diaryId || null,
        role: 'user',
        content: message,
        emotion_state: emotionProfile.primary_emotion,
        model_used: 'gpt-4o-mini'
      },
      {
        user_id: user.id,
        diary_id: diaryId || null,
        role: 'assistant',
        content: aiResponse,
        emotion_state: emotionProfile.primary_emotion,
        response_quality: responseQuality,
        processing_time: Date.now() - startTime,
        model_used: 'gpt-4o-mini'
      }
    ];

    await supabase
      .from('chat_history')
      .insert(historyInserts);

    // AI 추천 데이터 생성 (필요시)
    if (emotionProfile.needs_support && Math.random() > 0.7) { // 30% 확률로 추천 제공
      const { data: recommendations } = await supabase
        .rpc('get_emotion_recommendations', {
          target_user_id: user.id,
          current_emotion: emotionProfile.primary_emotion,
          recommendation_type: 'activity'
        });

      if (recommendations && recommendations.length > 0) {
        await supabase
          .from('ai_recommendations')
          .insert({
            user_id: user.id,
            diary_id: diaryId || null,
            recommendation_type: 'activity',
            recommendation_data: {
              suggestions: recommendations.slice(0, 2),
              context: 'chat_conversation'
            }
          });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        session_id: sessionId,
        emotion_profile: emotionProfile,
        conversation_depth: context.conversation_depth,
        response_quality: responseQuality,
        processing_time: Date.now() - startTime,
        model_used: 'gpt-4o-mini'
      })
    };

  } catch (error) {
    console.error('AI 채팅 스트리밍 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'AI 채팅 처리 중 오류가 발생했습니다.',
        detail: error.message
      })
    };
  }
};