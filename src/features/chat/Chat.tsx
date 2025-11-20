
import React, { useState } from 'react';
import './Chat.css';
import { chatWithGemini } from '../../services/aiService';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const reply = await chatWithGemini(input);
    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    setLoading(false);
  };

  return (
    <section className="chat-section">
      <h2>AI Chat Support</h2>
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <span>{m.text}</span>
          </div>
        ))}
        {loading && <div className="chat-message assistant">...thinking...</div>}
      </div>
      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything about your study…"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </section>
  );
};

export default Chat;
