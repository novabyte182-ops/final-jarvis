import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { VoiceController } from '../services/voice';
import { Send, Mic, Bot, User } from 'lucide-react';

const suggestedPrompts = [
  "What should I study next?",
  "Help me create a study schedule",
  "Explain quantum physics simply",
  "Remind me about my tasks",
  "When is my next prayer?",
  "Give me study tips for exams",
];

export default function ChatInterface({ userId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Assalamualaikum! I'm Jarvis, your AI assistant. I can help you with tasks, prayer scheduling, study planning, and answering academic questions. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const voiceController = new VoiceController({
    onResult: (text) => {
      setInput(text);
      setVoiceListening(false);
      sendMessage(text);
    },
    onStart: () => setVoiceListening(true),
    onEnd: () => setVoiceListening(false),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.chatWithAI(messageText, userId);
      const reply = data.reply || data.response || 'I received your message but could not generate a response.';
      const assistantMessage = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMessage]);
      voiceController.speak(reply);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }

    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-5 h-5" /> AI Chat</h2>
        <button
          onClick={() => voiceListening ? voiceController.stop() : voiceController.start()}
          className={`p-2 rounded-lg transition-all ${
            voiceListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-jarvis-card hover:bg-jarvis-accent/20'
          }`}
          title="Voice input"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {messages.length === 1 && (
        <div className="mb-4">
          <p className="text-jarvis-muted text-sm mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="bg-jarvis-card hover:bg-jarvis-accent/20 border border-jarvis-accent/10 rounded-lg px-3 py-1.5 text-sm transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-jarvis-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-jarvis-accent">
                <Bot className="w-5 h-5" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-jarvis-accent text-white'
                  : 'bg-jarvis-card border border-jarvis-accent/10'
              }`}
            >
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-jarvis-dark rounded-full flex items-center justify-center flex-shrink-0 text-jarvis-muted">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-jarvis-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-jarvis-accent">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-jarvis-card border border-jarvis-accent/10 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-jarvis-muted/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-jarvis-muted/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-jarvis-muted/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Jarvis anything..."
          className="flex-1 bg-jarvis-card border border-jarvis-accent/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-jarvis-accent placeholder:text-jarvis-muted/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-jarvis-accent hover:bg-jarvis-accentHover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
