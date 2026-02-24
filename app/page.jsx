'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SCENARIOS } from '@/lib/scenarios';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200 w-full sm:p-4">
      <div className="flex flex-col w-full h-full sm:h-[800px] max-w-[400px] bg-slate-50 sm:shadow-2xl sm:rounded-3xl relative overflow-hidden font-sans border-gray-300">

        {/* 헤더 */}
        <header className="px-5 pt-8 pb-4 bg-white border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Global Buddy</h1>
          <p className="text-sm text-gray-500 mt-1">어떤 상황을 연습할까요?</p>
        </header>

        {/* 시나리오 카드 그리드 */}
        <main className="flex-1 overflow-y-auto p-4 bg-[#f3f4f6]">
          <div className="grid grid-cols-2 gap-3">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => router.push(`/chat?scenario=${scenario.id}`)}
                className={`flex flex-col items-start p-4 rounded-2xl border ${scenario.color} active:scale-95 transition-transform duration-100 text-left`}
              >
                <span className="text-3xl mb-2">{scenario.emoji}</span>
                <span className="text-[15px] font-bold text-gray-900">{scenario.label}</span>
                <span className="text-xs text-gray-500 mt-0.5 leading-snug">{scenario.description}</span>
              </button>
            ))}
          </div>
        </main>

      </div>
    </div>
  );
}
