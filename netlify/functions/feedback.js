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

    // 테스트용: OpenAI API 키가 없을 때 더미 응답
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      const emotionFeedbacks = {
        happy: {
          feedback: "오늘 하루 정말 기쁜 일이 있으셨군요! 이런 행복한 감정을 오래 간직하시길 바랍니다.",
          song: "Happy",
          artist: "Pharrell Williams",
          reason: "밝고 경쾌한 멜로디가 당신의 기쁜 마음과 잘 어울립니다.",
          youtube: "https://www.youtube.com/watch?v=ZbZSe6N_BXs"
        },
        sad: {
          feedback: "힘든 시간을 보내고 계시는군요. 슬픔도 소중한 감정이니 충분히 느끼시고, 천천히 회복하시길 바랍니다.",
          song: "사랑했나봐",
          artist: "윤도현",
          reason: "따뜻한 위로가 되는 곡으로, 슬픈 마음을 달래는 데 도움이 될 것입니다.",
          youtube: "https://www.youtube.com/watch?v=cjJ89EGdFts"
        },
        angry: {
          feedback: "화가 나는 일이 있으셨군요. 분노는 자연스러운 감정이니 적절히 표현하시고, 마음을 진정시키시길 바랍니다.",
          song: "Let It Go",
          artist: "Frozen OST",
          reason: "감정을 해방시키고 마음을 정화하는 데 도움이 되는 곡입니다.",
          youtube: "https://www.youtube.com/watch?v=L0MK7qz13bU"
        },
        anxious: {
          feedback: "불안한 마음이 드시는군요. 깊게 숨을 쉬고, 지금 이 순간에 집중해보세요. 모든 것이 괜찮을 거예요.",
          song: "Weightless",
          artist: "Marconi Union",
          reason: "과학적으로 불안감을 줄이는 것으로 입증된 곡으로, 마음을 진정시키는 데 효과적입니다.",
          youtube: "https://www.youtube.com/watch?v=UfcAVejslrU"
        },
        neutral: {
          feedback: "평온한 하루를 보내셨네요. 이런 안정적인 감정도 소중합니다. 현재를 만끽하시길 바랍니다.",
          song: "Breathe Me",
          artist: "Sia",
          reason: "차분하고 내성적인 분위기로 평온한 마음을 유지하는 데 도움이 됩니다.",
          youtube: "https://www.youtube.com/watch?v=hSjIz8oQuko"
        }
      };

      const feedback = emotionFeedbacks[selectedEmotion] || emotionFeedbacks.neutral;

      const response = `✨ 감성 피드백: ${feedback.feedback}

🎵 추천곡 제목: ${feedback.song}
🎤 가수: ${feedback.artist}
📝 추천 이유: ${feedback.reason}
▶️ 유튜브 링크: ${feedback.youtube}`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ feedback: response })
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