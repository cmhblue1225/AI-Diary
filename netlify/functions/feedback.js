const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { diaryContent, selectedEmotion } = JSON.parse(event.body);

    if (!diaryContent || !selectedEmotion) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '일기 내용 또는 감정이 부족합니다.' })
      };
    }

    const prompt = `
일기 내용: ${diaryContent}

감정: ${selectedEmotion}

위의 일기 내용과 감정에 기반해서:
- 간결한 감성 피드백을 작성해줘.
- 감정에 어울리는 최신 인기곡 하나를 추천해줘.
- 추천곡 제목, 가수 이름, 추천 이유, 유튜브 링크를 각각 명확히 구분해서 알려줘.

항상 아래와 같은 형식으로 답변해:

---
✨ 감성 피드백: (텍스트)

🎵 추천곡 제목: (텍스트)
🎤 가수: (텍스트)
📝 추천 이유: (텍스트)
▶️ 유튜브 링크: (텍스트)
---
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const feedbackText = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ feedback: feedbackText })
    };
  } catch (error) {
    console.error('GPT feedback error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '피드백 생성 실패' })
    };
  }
};