const { OpenAI } = require('openai');

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
    const { content } = JSON.parse(event.body);

    if (!content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '일기 내용이 누락되었습니다.' })
      };
    }

    const prompt = `
사용자의 일기 내용을 분석하여 감정을 분류하세요.
감정은 반드시 다음 중 하나입니다: "happy", "sad", "angry", "anxious", "neutral".
다른 설명 없이 아래와 같은 JSON 형식으로만 응답하세요:

{"emotion": "happy"}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '감정 분석기입니다. 감정만 정확하게 JSON으로 응답하세요.' },
        { role: 'user', content: `${prompt}\n\n${content}` }
      ]
    });

    let emotion = '';
    const raw = completion.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(raw);
      emotion = parsed.emotion?.toLowerCase().trim();
    } catch (e) {
      console.error('JSON 파싱 실패:', raw);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GPT 응답 파싱 실패', raw })
      };
    }

    if (!['happy', 'sad', 'angry', 'anxious', 'neutral'].includes(emotion)) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '감정 분석 실패', emotion })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ emotion })
    };
  } catch (error) {
    console.error('GPT 분석 오류:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '감정 분석 중 오류 발생', detail: error.message })
    };
  }
};