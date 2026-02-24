import React, { useState, useEffect, useRef } from 'react';
// Lucide react에서 사용할 아이콘을 불러옵니다. Send는 종이비행기(전송), Bot은 AI 봇 프로필을 의미합니다.
import { Send, Bot } from 'lucide-react';

export default function App() {
  // 사용자와 AI가 주고받은 메시지 목록을 관리하는 상태(state)입니다.
  // 기본적으로 빈 배열로 시작합니다.
  const [messages, setMessages] = useState([]);
  
  // 사용자가 입력창에 타이핑하는 현재 텍스트를 관리하는 상태입니다.
  const [inputValue, setInputValue] = useState('');
  
  // 채팅창에 새로운 메시지가 추가될 때 자동으로 맨 아래로 스크롤하기 위한 참조(Ref)입니다.
  const messagesEndRef = useRef(null);

  // 메시지 목록이 업데이트(변경)될 때마다 실행되어, 화면을 맨 아래로 이동시킵니다.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 사용자가 메시지를 전송할 때 실행되는 함수입니다.
  const handleSend = (e) => {
    e.preventDefault(); // 폼 제출 시 페이지가 새로고침되는 현상을 막습니다.

    // 입력된 텍스트가 비어있거나 공백만 있다면 전송하지 않습니다.
    if (!inputValue.trim()) return;

    // 1. 사용자의 메시지 객체를 만들고 채팅 목록에 추가합니다.
    const userMessage = {
      id: Date.now(), // 고유한 ID로 현재 시간을 사용합니다.
      text: inputValue.trim(),
      sender: 'user', // 보낸 사람이 'user'임을 표시합니다.
    };

    setMessages((prev) => [...prev, userMessage]); // 기존 메시지들에 추가
    setInputValue(''); // 메시지 전송 후 입력창을 비웁니다.

    // 2. 1초 뒤에 AI가 자동으로 답변하도록 시뮬레이션(setTimeout)합니다.
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        text: "Hi there! I'm Sarah, your AI friend. How's your day going?",
        sender: 'ai', // 보낸 사람이 'ai'임을 표시합니다.
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000); // 1초(1000 밀리초) 뒤 실행
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200 w-full sm:p-4">
      {/* 
        모바일 화면처럼 보이도록 크기를 제한(max-w-md, h-full 혹은 지정 높이)합니다.
        전체 화면을 채우고, 플렉스박스 구조로 만들어 세로로 나열합니다. 
        모던한 느낌을 위해 배경색은 아주 연한 회색(bg-slate-50)을 사용했습니다.
      */}
      <div className="flex flex-col w-full h-full sm:h-[800px] max-w-[400px] bg-slate-50 sm:shadow-2xl sm:rounded-3xl relative overflow-hidden font-sans border-gray-300">
        
        {/* 1. 상단바 (Top Bar) 영역 */}
        <header className="flex items-center px-4 py-4 bg-white border-b border-gray-100 z-10 sticky top-0">
          <div className="relative">
            {/* AI 봇 프로필 아이콘 */}
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-blue-50 text-blue-500">
              <Bot size={24} />
            </div>
            {/* 온라인 상태를 나타내는 초록색 점 */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="ml-3">
            <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">AI 친구 (Sarah)</h1>
            <p className="text-xs text-green-600 font-medium tracking-wide">온라인</p>
          </div>
        </header>

        {/* 2. 채팅 목록 (Chat Area) 영역 */}
        {/* flex-1 속성을 주어 남는 공간을 모두 차지하게 하고 내용이 넘치면 스크롤되게 만듭니다. */}
        <main className="flex-1 p-4 overflow-y-auto w-full flex flex-col space-y-5 bg-[#f3f4f6]">
          
          {/* 앱 시작 시 표시되는 초기 안내 메시지 */}
          {messages.length === 0 && (
            <div className="flex justify-center my-6">
              <p className="text-xs text-gray-500 font-medium bg-gray-200/60 px-4 py-1.5 rounded-full inline-block">
                Sarah와 대화를 시작해보세요
              </p>
            </div>
          )}

          {/* 저장된 메시지 배열을 순회하면서 하나씩 말풍선을 그려냅니다. */}
          {messages.map((msg) => {
            // 보낸 사람이 사용자인지 AI인지 확인합니다.
            const isUser = msg.sender === 'user';
            
            return (
              <div 
                key={msg.id} 
                // 사용자의 말풍선은 오른쪽(justify-end), AI는 왼쪽(justify-start)에 배치합니다.
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  // 토스 앱 스타일 특유의 입체감 없는 플랫한 느낌과 부드러운 곡률(2xl) 적용
                  // 사용자 메시지 모서리와 상대방 메시지 모서리의 각진 부분을 디테일하게 설정합니다.
                  className={`max-w-[75%] px-4 py-2.5 shadow-sm break-words
                    ${isUser 
                      // 사용자가 보낸 경우: 파란색 배경에 흰색 글씨, 우측 하단만 덜 둥글게
                      ? 'bg-[#3182f6] text-white rounded-[20px] rounded-br-[4px]' 
                      // AI가 보낸 경우: 흰색 배경에 검은 글씨, 좌측 하단만 덜 둥글게
                      : 'bg-white text-gray-800 rounded-[20px] rounded-bl-[4px]'}
                  `}
                >
                  <p className="text-[15px] leading-relaxed tracking-tight">{msg.text}</p>
                </div>
              </div>
            );
          })}
          
          {/* 스크롤 위치를 잡아주기 위한 투명한 빈 요소입니다. */}
          <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
        </main>

        {/* 3. 입력창 (Input Area) 영역 */}
        <footer className="bg-white px-4 py-3 border-t border-gray-100 sticky bottom-0 z-10">
          <form 
            onSubmit={handleSend} // 엔터를 치거나 버튼을 누르면 handleSend 실행
            className="flex items-center space-x-2 bg-[#f2f4f6] rounded-full px-4 py-2 mt-1 mb-2"
          >
            <input
              type="text"
              value={inputValue}
              // 사용자가 입력할 때마다 inputValue 상태를 갱신합니다.
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-transparent text-[#191f28] placeholder-gray-400 text-[15px] focus:outline-none"
            />
            <button
              type="submit"
              // 입력창이 비어있으면 버튼을 비활성화(회색) 처리합니다.
              disabled={!inputValue.trim()}
              className={`flex items-center justify-center p-2 rounded-full transition-colors duration-200
                ${inputValue.trim() 
                  ? 'bg-[#3182f6] text-white hover:bg-blue-600' 
                  : 'bg-gray-300 text-white cursor-not-allowed'}`}
            >
              {/* 비행기 모양 전송 아이콘 */}
              <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
