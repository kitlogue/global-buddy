'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { getScenario, SCENARIOS } from '@/lib/scenarios';

// AI 메시지를 네 파트로 분리:
//   userTranslation — 사용자 한국어 입력의 영어 번역 (🇰🇷 → 🇺🇸)
//   main            — Sarah의 실제 영어 응답
//   translationText — Sarah 응답의 한국어 번역 (🇰🇷 "...")
//   naturalness     — 사용자 영어 교정 블록 (💬 더 자연스럽게)
function parseAIMessage(text) {
  const lines = text.split('\n');

  // 💬 블록 시작점을 먼저 찾아서 앞/뒤로 분리 — 이후 줄은 절대 mainLines에 포함되지 않음
  const naturalnessStart = lines.findIndex((l) => l.trim().startsWith('💬'));
  const contentLines = naturalnessStart >= 0 ? lines.slice(0, naturalnessStart) : lines;
  const naturalnessLines = naturalnessStart >= 0 ? lines.slice(naturalnessStart) : [];

  // 교정 대안 추출 (① ②)
  const naturalness = naturalnessLines
    .filter((l) => l.trim().startsWith('①') || l.trim().startsWith('②'))
    .map((l) => l.trim().replace(/^[①②]\s*"?/, '').replace(/"$/, '').trim());

  // 본문 파싱
  // 🇰🇷 → 🇺🇸 는 응답 첫 줄에만 허용 — AI가 자기 응답을 이 형식으로 잘못 출력해도 걸러냄
  const mainLines = [];
  let userTranslation = '';
  let translationText = '';
  let firstNonEmptyPassed = false;

  for (const line of contentLines) {
    const trimmed = line.trim();
    if (!trimmed) { if (firstNonEmptyPassed) mainLines.push(line); continue; }

    const isFirstLine = !firstNonEmptyPassed;
    firstNonEmptyPassed = true;

    const isUserTranslation = isFirstLine && trimmed.startsWith('🇰🇷') && trimmed.includes('→');
    const isSarahTranslation = trimmed.startsWith('🇰🇷') && !trimmed.includes('→');
    const isExplanation = trimmed.startsWith('📝');

    if (isUserTranslation) {
      userTranslation = trimmed.replace(/^🇰🇷\s*→\s*🇺🇸\s*"?/, '').replace(/"$/, '').trim();
    } else if (isSarahTranslation) {
      translationText = trimmed.replace(/^🇰🇷\s*"?/, '').replace(/"$/, '').trim();
    } else if (!isExplanation) {
      mainLines.push(line);
    }
  }

  const main = mainLines.join('\n').trim();

  // 안전장치: AI가 응답을 🇰🇷 → 🇺🇸 에 잘못 넣어 main이 비면 userTranslation을 main으로 복구
  if (!main && userTranslation) {
    return { main: userTranslation, userTranslation: '', translationText, naturalness, hasExtra: !!translationText };
  }

  return { main, userTranslation, translationText, naturalness, hasExtra: !!translationText };
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get('scenario') ?? 'free';
  const scenario = getScenario(scenarioId) ?? SCENARIOS[0];

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const messagesEndRef = useRef(null);
  const openingFetched = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 시나리오 진입 시 AI가 먼저 대화 시작 (자유 대화 제외)
  useEffect(() => {
    if (!scenario.openingTrigger || openingFetched.current) return;
    openingFetched.current = true;

    const triggerText = typeof scenario.openingTrigger === 'function'
      ? scenario.openingTrigger(scenario.openingTopics[Math.floor(Math.random() * scenario.openingTopics.length)])
      : scenario.openingTrigger;
    const trigger = { id: 0, text: triggerText, sender: 'user', hidden: true };
    setIsLoading(true);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [trigger], scenario: scenarioId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.reply) {
          setMessages([trigger, { id: 1, text: data.reply, sender: 'ai' }]);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const toggleTranslation = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: 'user',
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, scenario: scenarioId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '응답에 실패했어요.');
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'ai' }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: '응답에 실패했어요. 다시 시도해주세요.',
        sender: 'ai',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200 w-full sm:p-4">
      <div className="flex flex-col w-full h-full sm:h-[800px] max-w-[400px] bg-slate-50 sm:shadow-2xl sm:rounded-3xl relative overflow-hidden font-sans border-gray-300">

        {/* 헤더 */}
        <header className="flex items-center px-4 py-4 bg-white border-b border-gray-100 z-10 sticky top-0 gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 text-2xl flex-shrink-0">
            {scenario.emoji}
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">
              {scenario.label}
            </h1>
            <p className={`text-xs font-medium ${scenario.accentColor}`}>Sarah 코치</p>
          </div>
        </header>

        {/* 채팅 영역 */}
        <main className="flex-1 p-4 overflow-y-auto w-full flex flex-col space-y-5 bg-[#f3f4f6]">

          {messages.filter((m) => !m.hidden).length === 0 && !isLoading && (
            <div className="flex justify-center my-6">
              <p className="text-xs text-gray-500 font-medium bg-gray-200/60 px-4 py-1.5 rounded-full inline-block">
                Sarah와 대화를 시작해보세요
              </p>
            </div>
          )}

          {messages.filter((m) => !m.hidden).map((msg, index, arr) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              const nextMsg = arr[index + 1];
              const nextParsed = nextMsg?.sender === 'ai' ? parseAIMessage(nextMsg.text) : null;
              const userTranslation = nextParsed?.userTranslation ?? '';
              const naturalness = nextParsed?.naturalness ?? [];

              return (
                <div key={msg.id} className="flex flex-col items-end gap-1">
                  <div className="max-w-[75%] px-4 py-2.5 shadow-sm break-words bg-[#3182f6] text-white rounded-[20px] rounded-br-[4px]">
                    <p className="text-[15px] leading-relaxed tracking-tight whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {userTranslation && (
                    <span className="text-[12px] text-gray-400 italic px-1">
                      {userTranslation}
                    </span>
                  )}
                  {naturalness.length > 0 && (
                    <div className="flex flex-col items-end gap-0.5 px-1">
                      <span className="text-[11px] font-semibold text-orange-400">💬 더 자연스럽게</span>
                      {naturalness.map((alt, i) => (
                        <span key={i} className="text-[12px] text-gray-500">
                          {i === 0 ? '①' : '②'} "{alt}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // AI 메시지: 영어 본문 + 번역 토글
            const { main, translationText, hasExtra } = parseAIMessage(msg.text);
            const isExpanded = expandedIds.has(msg.id);

            return (
              <div key={msg.id} className="flex flex-col gap-1">
              <div className="flex justify-start">
                <div className="max-w-[75%] shadow-sm break-words bg-white text-gray-800 rounded-[20px] rounded-bl-[4px] overflow-hidden">
                  {/* 영어 본문 */}
                  <div className="px-4 pt-2.5 pb-2">
                    <p className="text-[15px] leading-relaxed tracking-tight whitespace-pre-wrap">{main}</p>
                  </div>

                  {/* 번역 및 해설 토글 버튼 */}
                  {hasExtra && (
                    <>
                      <button
                        onClick={() => toggleTranslation(msg.id)}
                        className="flex items-center gap-1 w-full px-4 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors border-t border-gray-100"
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {isExpanded ? '번역 닫기' : '번역 보기'}
                      </button>

                      {/* 번역 + 해설 내용 */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                          <p className="text-[11px] font-bold text-blue-400 mb-1">[번역]</p>
                          <p className="text-[13px] leading-relaxed text-gray-600">{translationText}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-[20px] rounded-bl-[4px] px-4 py-3 shadow-sm flex items-center space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
        </main>

        {/* 입력 영역 */}
        <footer className="bg-white px-4 py-3 border-t border-gray-100 sticky bottom-0 z-10">
          <form
            onSubmit={handleSend}
            className="flex items-center space-x-2 bg-[#f2f4f6] rounded-full px-4 py-2 mt-1 mb-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="영어로 입력해보세요, 한글도 괜찮아요!"
              className="flex-1 bg-transparent text-[#191f28] placeholder-gray-400 text-[15px] focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`flex items-center justify-center p-2 rounded-full transition-colors duration-200
                ${inputValue.trim() && !isLoading
                  ? 'bg-[#3182f6] text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-white cursor-not-allowed'}`}
            >
              <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-gray-200">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
