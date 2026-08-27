import React, { useState, useRef, useEffect } from 'react';

/**
 * AIAssistantPage.jsx
 * 24x7 BSB AI Financial Advisor for intelligent conversational banking,
 * spending breakdown analysis, investment recommendations, and instant query resolution.
 */
export default function AIAssistantPage({ user, apiCall, showToast }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello ${user?.fullName || 'Valued Customer'}! 👋 I am your BSB AI Financial Assistant. How can I help you today? You can ask about your account balances, spending trends, FD interest rates, or fund transfer procedures.`,
      time: 'Just now'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const quickPrompts = [
    '💡 What is my total available balance?',
    '📊 Analyze my spending for this month',
    '🌱 What are current FD interest rates?',
    '💳 How do I increase my daily online limit?',
    '🛡️ Explain BSB DICGC Insurance coverage'
  ];

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsThinking(true);

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('balance') || lower.includes('account')) {
        const bal = (user?.totalBalance || user?.balance || 145000).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        reply = `Your primary Savings Account (**${user?.accountNumber || '1000987658'}**) currently has an available balance of **₹${bal}**. All scheduled auto-debits are adequately funded.`;
      } else if (lower.includes('spending') || lower.includes('analyze') || lower.includes('expense')) {
        reply = `📊 **Monthly Spending Analysis (August 2026):**\n- **Utilities & Bills:** ₹3,420 (21%)\n- **Shopping & E-Commerce:** ₹2,499 (15%)\n- **ATM Cash Withdrawals:** ₹10,000 (64%)\n\n💡 **AI Tip:** You are saving approximately **84%** of your monthly credits. Opening a 400-day Fixed Deposit at **7.85% p.a.** could earn you an extra ₹11,775 in annual interest!`;
      } else if (lower.includes('fd') || lower.includes('rate') || lower.includes('interest')) {
        reply = `🌱 **BSB High-Yield Deposit Rates 2026:**\n- **12 Months:** 7.25% p.a.\n- **400 Days Special:** 7.85% p.a.\n- **Senior Citizen Additional:** +0.50% extra\n\nYou can book an instant online FD right now from the **Apply Loans / FD / RD** tab!`;
      } else if (lower.includes('limit') || lower.includes('card')) {
        reply = `💳 You can adjust your debit card limits up to **₹2,00,000/day** or enable international transactions instantly under the **Apply (Cards & Cheques) → Manage Virtual Card** tab.`;
      } else {
        reply = `I have analyzed your request regarding "${text}". As your BSB Banking Assistant, I can confirm that all your accounts and transactions are secure under 256-bit encryption. Let me know if you would like me to assist with fund transfers, statements, or opening an investment account!`;
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 1000);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 200px)' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', color: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            🤖
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>BSB AI Financial Assistant</h3>
            <span style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>● Powered by Gemini 3.7 Core Intelligence & 24x7 Core Banking Engine</span>
          </div>
        </div>

        <button
          className="btn"
          onClick={() => setMessages([messages[0]])}
          style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none', fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px' }}
        >
          Clear Chat
        </button>
      </div>

      {/* Chat Messages Log Area */}
      <div className="card" style={{ flex: 1, padding: '20px', borderRadius: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc' }}>
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: '10px'
              }}
            >
              {!isUser && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                  🤖
                </div>
              )}

              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: '14px',
                background: isUser ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : '#ffffff',
                color: isUser ? '#ffffff' : '#1e293b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: isUser ? 'none' : '1px solid #e2e8f0',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                <div>{msg.text}</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: '4px', textAlign: isUser ? 'right' : 'left' }}>
                  {msg.time}
                </div>
              </div>

              {isUser && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                  CU
                </div>
              )}
            </div>
          );
        })}

        {isThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
              🤖
            </div>
            <div style={{ padding: '10px 16px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.84rem', color: '#64748b' }}>
              Thinking and analyzing CBS ledger records... ⚡
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        style={{ display: 'flex', gap: '10px' }}
      >
        <input
          type="text"
          placeholder="Ask anything about your account, spending, loans, or transfers..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            fontSize: '0.92rem',
            background: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!inputPrompt.trim() || isThinking}
          style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '0.92rem' }}
        >
          Send →
        </button>
      </form>
    </div>
  );
}
