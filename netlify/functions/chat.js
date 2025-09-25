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
    const { message, history = [] } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '메시지가 누락되었습니다.' })
      };
    }

    // 시스템 프롬프트 - 감정 상담 전문 AI
    const systemPrompt = `
당신은 따뜻하고 공감적인 감정 상담 AI입니다. 사용자의 마음을 이해하고 위로하며, 건설적인 조언을 제공하세요.

특징:
- 친근하고 따뜻한 말투
- 사용자의 감정을 먼저 공감
- 구체적이고 실용적인 조언 제공
- 긍정적인 관점 제시
- 필요시 전문가 상담 권유

답변 길이: 2-3문장으로 간결하게
    `;

    // 대화 히스토리 구성
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // 최근 10개 대화만 유지
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300
    });

    const reply = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '채팅 처리 중 오류가 발생했습니다.' })
    };
  }
};