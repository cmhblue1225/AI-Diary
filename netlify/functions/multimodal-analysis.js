import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bXZneXhzc2NmeWZsZ3hjcG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDI4NzgsImV4cCI6MjA1OTk3ODg3OH0.-hQSBKVvPUX_KpbOp0zT25xMEjmky3WR-STC06kP0n4'
);

// GPT-4 Vision으로 이미지 분석
async function analyzeImageWithGPT4Vision(imageBase64, textContext = '') {
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
            content: `당신은 이미지를 통해 감정을 분석하는 전문가입니다. 다음을 분석해주세요:

1. 주요 감정 요소 (색상, 구도, 객체 등)
2. 추정되는 감정 상태 (5가지 표준 감정 중: happy, sad, angry, anxious, neutral)
3. 감정 강도 (0-100)
4. 이미지-텍스트 일치도 분석
5. 시각적 감정 표현의 특징

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "visual_emotions": [
    {"type": "emotion_key", "intensity": 85, "confidence": 0.95}
  ],
  "visual_elements": {
    "dominant_colors": ["색상1", "색상2"],
    "composition": "구도 분석",
    "key_objects": ["객체1", "객체2"],
    "lighting": "조명 분석"
  },
  "mood_indicators": {
    "overall_mood": "전체적 분위기",
    "energy_level": "에너지 수준 (low/medium/high)",
    "emotional_tone": "감정적 톤"
  },
  "text_image_alignment": 0.85,
  "ai_insights": "이미지 기반 감정 분석 인사이트",
  "recommendations": "이미지 분석 기반 추천사항"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: textContext ? `일기 내용: "${textContext}"\n\n위 일기와 함께 첨부된 이미지를 분석해주세요.` : '다음 이미지의 감정을 분석해주세요.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 Vision API 오류');
    }

    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('이미지 분석 오류:', error);
    return null;
  }
}

// 음성을 텍스트로 변환 (Whisper API)
async function transcribeAudioWithWhisper(audioBase64) {
  try {
    // Base64를 blob으로 변환
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'ko');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Whisper API 오류');
    }

    return result.text;
  } catch (error) {
    console.error('음성 변환 오류:', error);
    return null;
  }
}

// 음성 감정 분석 (톤, 속도, 강세 등)
async function analyzeVoiceEmotion(transcribedText, audioMetadata = {}) {
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
            content: `당신은 음성을 통해 감정을 분석하는 전문가입니다. 변환된 텍스트와 음성 메타데이터를 바탕으로 다음을 분석해주세요:

1. 텍스트 기반 감정 분석
2. 음성 특성 추정 (톤, 속도, 강세)
3. 감정 상태 (24가지 감정 중)
4. 스트레스 레벨 추정
5. 발화 패턴 분석

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "voice_emotions": [
    {"type": "emotion_key", "intensity": 85, "confidence": 0.95}
  ],
  "speech_characteristics": {
    "estimated_tone": "톤 분석",
    "speech_pace": "빠름/보통/느림",
    "emotional_intensity": "감정 강도",
    "stress_indicators": ["스트레스 지표들"]
  },
  "transcribed_content": "변환된 텍스트",
  "voice_insights": "음성 기반 감정 분석 인사이트",
  "recommendations": "음성 분석 기반 추천사항"
}`
          },
          {
            role: 'user',
            content: `변환된 텍스트: "${transcribedText}"\n\n음성 메타데이터: ${JSON.stringify(audioMetadata)}\n\n위 정보를 바탕으로 감정 분석을 해주세요.`
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 API 오류');
    }

    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('음성 감정 분석 오류:', error);
    return null;
  }
}

// 멀티모달 통합 분석
async function combineMultimodalAnalysis(textAnalysis, imageAnalysis, voiceAnalysis) {
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
            content: `당신은 멀티모달 감정 분석 전문가입니다. 텍스트, 이미지, 음성 분석 결과를 종합하여 최종 감정 분석을 제공해주세요.

각 모달리티의 가중치를 고려하고, 일치하지 않는 부분은 설명해주세요.

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "final_emotions": [
    {"type": "emotion_key", "intensity": 85, "confidence": 0.95, "sources": ["text", "image", "voice"]}
  ],
  "modality_weights": {
    "text": 0.4,
    "image": 0.3,
    "voice": 0.3
  },
  "consistency_analysis": {
    "overall_consistency": 0.85,
    "conflicting_signals": ["충돌하는 신호들"],
    "dominant_modality": "주도적 모달리티"
  },
  "comprehensive_insights": "종합적 감정 분석 인사이트",
  "multimodal_recommendations": "멀티모달 분석 기반 추천사항",
  "confidence_explanation": "신뢰도 설명"
}`
          },
          {
            role: 'user',
            content: `텍스트 분석: ${JSON.stringify(textAnalysis)}

이미지 분석: ${JSON.stringify(imageAnalysis)}

음성 분석: ${JSON.stringify(voiceAnalysis)}

위 3가지 분석 결과를 종합하여 최종 감정 분석을 해주세요.`
          }
        ],
        max_tokens: 1200,
        temperature: 0.3
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 API 오류');
    }

    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('멀티모달 통합 분석 오류:', error);
    return null;
  }
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
    const {
      diaryId,
      textContent,
      textAnalysis,
      imageData, // base64 인코딩된 이미지
      audioData, // base64 인코딩된 오디오
      audioMetadata,
      analysisType = 'multimodal'
    } = JSON.parse(event.body || '{}');

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

    const analyses = {};
    const processingSteps = [];

    // 이미지 분석
    if (imageData && analysisType.includes('image')) {
      processingSteps.push('이미지 분석 중...');
      analyses.image = await analyzeImageWithGPT4Vision(imageData, textContent);
    }

    // 음성 분석
    if (audioData && analysisType.includes('voice')) {
      processingSteps.push('음성 변환 중...');
      const transcribedText = await transcribeAudioWithWhisper(audioData);

      if (transcribedText) {
        processingSteps.push('음성 감정 분석 중...');
        analyses.voice = await analyzeVoiceEmotion(transcribedText, audioMetadata);
        analyses.transcription = transcribedText;
      }
    }

    // 텍스트 분석 포함
    if (textAnalysis) {
      analyses.text = textAnalysis;
    }

    // 멀티모달 통합 분석
    let finalAnalysis = null;
    if (Object.keys(analyses).length > 1) {
      processingSteps.push('멀티모달 통합 분석 중...');
      finalAnalysis = await combineMultimodalAnalysis(
        analyses.text,
        analyses.image,
        analyses.voice
      );
    }

    // 첨부 파일 정보 저장
    const attachments = [];

    if (imageData && diaryId) {
      // 실제 환경에서는 Supabase Storage에 이미지 업로드
      const imageAttachment = {
        diary_id: diaryId,
        attachment_type: 'image',
        file_url: 'temp://image_placeholder', // 실제로는 Storage URL
        analysis_result: analyses.image,
        confidence_score: analyses.image?.visual_emotions?.[0]?.confidence || 0
      };

      const { data: imageInsert } = await supabase
        .from('multimodal_attachments')
        .insert(imageAttachment)
        .select()
        .single();

      if (imageInsert) attachments.push(imageInsert);
    }

    if (audioData && diaryId) {
      // 실제 환경에서는 Supabase Storage에 오디오 업로드
      const audioAttachment = {
        diary_id: diaryId,
        attachment_type: 'voice',
        file_url: 'temp://audio_placeholder', // 실제로는 Storage URL
        analysis_result: analyses.voice,
        confidence_score: analyses.voice?.voice_emotions?.[0]?.confidence || 0
      };

      const { data: audioInsert } = await supabase
        .from('multimodal_attachments')
        .insert(audioAttachment)
        .select()
        .single();

      if (audioInsert) attachments.push(audioInsert);
    }

    // 분석 메트릭 저장
    const processingTime = Date.now() - startTime;

    await supabase
      .from('analysis_metrics')
      .insert({
        user_id: user.id,
        analysis_type: 'multimodal',
        processing_time_ms: processingTime,
        confidence_score: finalAnalysis?.consistency_analysis?.overall_consistency || 0.8,
        model_version: 'gpt-4o-mini+whisper-1',
        success_rate: finalAnalysis ? 1.0 : 0.5
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        individual_analyses: analyses,
        final_analysis: finalAnalysis,
        attachments: attachments,
        processing_steps: processingSteps,
        processing_time: processingTime,
        supported_formats: {
          image: ['jpg', 'jpeg', 'png', 'webp'],
          audio: ['webm', 'mp3', 'wav', 'm4a'],
          max_file_size: '10MB'
        }
      })
    };

  } catch (error) {
    console.error('멀티모달 분석 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '멀티모달 분석 중 오류가 발생했습니다.',
        detail: error.message
      })
    };
  }
};