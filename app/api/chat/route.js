import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getScenario, FALLBACK_SYSTEM_PROMPT } from '@/lib/scenarios';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ──────────────────────────────────────────────
// 대화 로그를 로컬 파일에 저장
// 경로: logs/YYYY-MM-DD/HHMMSS_시나리오.txt
// ──────────────────────────────────────────────
function saveLog({ sessionId, scenarioId, userText, aiReply }) {
  try {
    const scenario = getScenario(scenarioId);
    const label = scenario?.label ?? scenarioId;
    const emoji = scenario?.emoji ?? '';

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const dateFolder = `${yyyy}-${mm}-${dd}`;
    const logsDir = path.join(process.cwd(), 'logs', dateFolder);
    fs.mkdirSync(logsDir, { recursive: true });

    const filename = `${sessionId}_${label}.txt`;
    const filepath = path.join(logsDir, filename);

    // 파일이 없으면 헤더를 먼저 작성
    if (!fs.existsSync(filepath)) {
      const header =
        `📅 ${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} | ${emoji} ${label}\n` +
        `${'═'.repeat(44)}\n`;
      fs.writeFileSync(filepath, header, 'utf8');
    }

    // 대화 한 턴을 파일에 추가
    const entry = `[사용자] ${userText}\n[Sarah]  ${aiReply}\n`;
    fs.appendFileSync(filepath, entry, 'utf8');
  } catch (err) {
    // 로그 실패가 서비스에 영향을 주지 않도록 오류만 출력
    console.error('로그 저장 실패:', err);
  }
}

// ──────────────────────────────────────────────
// API 핸들러
// ──────────────────────────────────────────────
export async function POST(request) {
  try {
    const { messages, scenario: scenarioId, sessionId } = await request.json();

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

    // hidden 메시지(오프닝 트리거)는 로그에 남기지 않음
    if (!lastMessage.hidden && sessionId) {
      saveLog({
        sessionId,
        scenarioId,
        userText: lastMessage.text,
        aiReply: reply,
      });
    }

    return Response.json({ reply });
  } catch (error) {
    console.error('Gemini API error:', error);
    return Response.json(
      { error: '응답에 실패했어요. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
