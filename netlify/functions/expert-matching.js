import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bXZneXhzc2NmeWZsZ3hjcG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDI4NzgsImV4cCI6MjA1OTk3ODg3OH0.-hQSBKVvPUX_KpbOp0zT25xMEjmky3WR-STC06kP0n4'
);

// AI로 사용자 상담 요구사항 분석
async function analyzeUserConsultationNeeds(userId) {
  try {
    // 사용자의 최근 감정 패턴 분석
    const { data: recentDiaries } = await supabase
      .from('diaries')
      .select('emotion, mood_score, content, ai_insights, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentDiaries || recentDiaries.length === 0) {
      return null;
    }

    const recentContent = recentDiaries.map(d => d.content).join(' ').substring(0, 1000);
    const emotions = recentDiaries.map(d => d.emotion);
    const avgMoodScore = recentDiaries.reduce((sum, d) => sum + (d.mood_score || 0), 0) / recentDiaries.length;

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
            content: `당신은 심리상담 전문가 매칭 시스템의 AI 분석가입니다. 사용자의 감정 패턴과 일기 내용을 분석하여 적합한 상담사 유형과 상담 방식을 추천해주세요.

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "urgency_level": "low/medium/high/critical",
  "primary_concerns": ["주요 관심사1", "주요 관심사2"],
  "recommended_specializations": ["전문분야1", "전문분야2"],
  "consultation_type": "text_chat/video_call/voice_call",
  "session_frequency": "weekly/biweekly/monthly",
  "estimated_duration": "단기(1-3개월)/중기(3-6개월)/장기(6개월 이상)",
  "crisis_indicators": ["위기 지표들"],
  "support_level_needed": "light/moderate/intensive",
  "personality_match": "따뜻한/분석적/직접적/공감적",
  "preparation_notes": "상담 준비를 위한 노트"
}`
          },
          {
            role: 'user',
            content: `사용자 감정 분석 데이터:

최근 감정 패턴: ${emotions.join(', ')}
평균 기분 점수: ${avgMoodScore} (-100~+100)
일기 분석 샘플: "${recentContent}"

위 데이터를 바탕으로 적합한 상담사 매칭을 위한 분석을 해주세요.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 API 오류');
    }

    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('상담 요구사항 분석 오류:', error);
    return null;
  }
}

// 상담사 매칭 알고리즘
async function findMatchingExperts(userNeeds, availableTimeSlot = null) {
  try {
    let query = supabase
      .from('expert_profiles')
      .select(`
        *,
        user_id,
        total_consultations,
        rating
      `)
      .eq('is_active', true)
      .eq('license_verified', true);

    const { data: allExperts } = await query;

    if (!allExperts || allExperts.length === 0) {
      return [];
    }

    // 매칭 점수 계산
    const scoredExperts = allExperts.map(expert => {
      let matchScore = 0;

      // 전문분야 매칭 (40% 가중치)
      const specializationMatch = userNeeds.recommended_specializations?.some(spec =>
        expert.specializations?.includes(spec)
      );
      if (specializationMatch) matchScore += 40;

      // 경험년수 점수 (20% 가중치)
      const experienceScore = Math.min(20, (expert.experience_years || 0) * 2);
      matchScore += experienceScore;

      // 평점 점수 (20% 가중치)
      const ratingScore = (expert.rating || 0) * 4; // 5점 만점을 20점으로 변환
      matchScore += ratingScore;

      // 상담 횟수 (경험) 점수 (10% 가중치)
      const consultationScore = Math.min(10, (expert.total_consultations || 0) / 10);
      matchScore += consultationScore;

      // 긴급도에 따른 가용성 점수 (10% 가중치)
      if (userNeeds.urgency_level === 'critical' || userNeeds.urgency_level === 'high') {
        // 실제로는 available_slots를 체크해야 하지만 여기서는 간단히 처리
        matchScore += 10;
      }

      return {
        ...expert,
        match_score: Math.round(matchScore),
        match_reasons: [
          specializationMatch && '전문분야 일치',
          expert.experience_years > 5 && '풍부한 경험',
          expert.rating > 4.5 && '높은 평점',
          expert.total_consultations > 50 && '많은 상담 경험'
        ].filter(Boolean)
      };
    });

    // 매칭 점수 순으로 정렬
    scoredExperts.sort((a, b) => b.match_score - a.match_score);

    return scoredExperts.slice(0, 5); // 상위 5명 반환
  } catch (error) {
    console.error('전문가 매칭 오류:', error);
    return [];
  }
}

// 상담 세션 준비 요약 생성
async function generateConsultationPreparation(userId, expertId) {
  try {
    // 사용자 감정 히스토리
    const { data: userHistory } = await supabase
      .from('diaries')
      .select('emotion, mood_score, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 전문가 정보
    const { data: expert } = await supabase
      .from('expert_profiles')
      .select('specializations, bio')
      .eq('id', expertId)
      .single();

    if (!userHistory || !expert) {
      return null;
    }

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
            content: `당신은 심리상담 준비를 돕는 AI 어시스턴트입니다. 상담자의 감정 히스토리와 상담사 정보를 바탕으로 효과적인 상담을 위한 준비 자료를 생성해주세요.

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "session_summary": "상담 세션 요약",
  "key_discussion_points": ["논의할 주요 포인트들"],
  "emotional_timeline": "최근 감정 변화 요약",
  "goals_suggestions": ["상담 목표 제안들"],
  "questions_to_explore": ["탐구할 질문들"],
  "coping_strategies_review": ["검토할 대처 방법들"],
  "progress_indicators": ["진전 지표들"]
}`
          },
          {
            role: 'user',
            content: `사용자 감정 히스토리:
${JSON.stringify(userHistory, null, 2)}

상담사 정보:
전문분야: ${expert.specializations?.join(', ')}
소개: ${expert.bio}

위 정보를 바탕으로 상담 준비 요약을 생성해주세요.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 API 오류');
    }

    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('상담 준비 요약 생성 오류:', error);
    return null;
  }
}

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

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
      const urlParams = new URLSearchParams(event.queryStringParameters || '');
      const action = urlParams.get('action') || 'analyze_needs';

      if (action === 'analyze_needs') {
        // 사용자 상담 요구사항 분석
        const userNeeds = await analyzeUserConsultationNeeds(user.id);

        if (!userNeeds) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: '상담 요구사항을 분석할 수 있는 충분한 데이터가 없습니다.',
              recommendation: '최소 3개 이상의 일기를 작성해주세요.'
            })
          };
        }

        // 매칭되는 전문가 찾기
        const matchingExperts = await findMatchingExperts(userNeeds);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user_needs: userNeeds,
            matching_experts: matchingExperts,
            total_available_experts: matchingExperts.length
          })
        };
      }

      if (action === 'experts') {
        // 모든 활성화된 전문가 목록
        const { data: experts } = await supabase
          .from('expert_profiles')
          .select('*')
          .eq('is_active', true)
          .eq('license_verified', true)
          .order('rating', { ascending: false });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            experts: experts || []
          })
        };
      }

      if (action === 'my_consultations') {
        // 내 상담 예약 목록
        const { data: consultations } = await supabase
          .from('expert_consultations')
          .select(`
            *,
            expert_profiles!inner(expert_type, specializations, bio)
          `)
          .eq('user_id', user.id)
          .order('scheduled_at', { ascending: false });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            consultations: consultations || []
          })
        };
      }
    }

    if (event.httpMethod === 'POST') {
      const { action, expert_id, consultation_type, scheduled_at, duration_minutes } = JSON.parse(event.body || '{}');

      if (action === 'book_consultation') {
        if (!expert_id || !consultation_type || !scheduled_at) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '전문가 ID, 상담 유형, 예약 시간이 필요합니다.' })
          };
        }

        // 전문가 정보 확인
        const { data: expert } = await supabase
          .from('expert_profiles')
          .select('*')
          .eq('id', expert_id)
          .eq('is_active', true)
          .single();

        if (!expert) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: '전문가를 찾을 수 없습니다.' })
          };
        }

        // 상담 준비 요약 생성
        const preparationSummary = await generateConsultationPreparation(user.id, expert_id);

        // 상담 예약 생성
        const newConsultation = {
          user_id: user.id,
          expert_id: expert_id,
          consultation_type: consultation_type,
          scheduled_at: scheduled_at,
          duration_minutes: duration_minutes || 50,
          ai_preparation_summary: preparationSummary
        };

        const { data: consultation, error: consultationError } = await supabase
          .from('expert_consultations')
          .insert(newConsultation)
          .select()
          .single();

        if (consultationError) {
          throw new Error('상담 예약 실패: ' + consultationError.message);
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            consultation: consultation,
            preparation_summary: preparationSummary,
            expert_info: expert
          })
        };
      }

      if (action === 'rate_consultation') {
        const { consultation_id, user_rating, session_notes } = JSON.parse(event.body || '{}');

        if (!consultation_id || !user_rating) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '상담 ID와 평점이 필요합니다.' })
          };
        }

        // 상담 평가 업데이트
        const { data: updatedConsultation } = await supabase
          .from('expert_consultations')
          .update({
            user_rating: user_rating,
            session_notes: session_notes,
            status: 'completed'
          })
          .eq('id', consultation_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updatedConsultation) {
          // 전문가 평점 업데이트 (간단한 평균 계산)
          const { data: expertConsultations } = await supabase
            .from('expert_consultations')
            .select('user_rating')
            .eq('expert_id', updatedConsultation.expert_id)
            .not('user_rating', 'is', null);

          if (expertConsultations && expertConsultations.length > 0) {
            const avgRating = expertConsultations.reduce((sum, c) => sum + c.user_rating, 0) / expertConsultations.length;

            await supabase
              .from('expert_profiles')
              .update({
                rating: avgRating,
                total_consultations: expertConsultations.length
              })
              .eq('id', updatedConsultation.expert_id);
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            updated_consultation: updatedConsultation
          })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };

  } catch (error) {
    console.error('전문가 매칭 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '전문가 매칭 처리 중 오류가 발생했습니다.',
        detail: error.message
      })
    };
  }
};