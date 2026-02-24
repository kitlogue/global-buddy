import { GoogleGenerativeAI } from '@google/generative-ai';
import { getScenario, FALLBACK_SYSTEM_PROMPT } from '@/lib/scenarios';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { messages, scenario: scenarioId } = await request.json();

    const systemPrompt = getScenario(scenarioId)?.systemPrompt ?? FALLBACK_SYSTEM_PROMPT;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    // 마지막 메시지를 제외한 이전 대화를 history로 전달
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.text);
    const reply = result.response.text();

    return Response.json({ reply });
  } catch (error) {
    console.error('Gemini API error:', error);
    return Response.json(
      { error: '응답에 실패했어요. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
