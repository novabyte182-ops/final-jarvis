import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import PrayerWidget from './components/PrayerWidget';
import StudyPlanner from './components/StudyPlanner';
import ChatInterface from './components/ChatInterface';
import { VoiceController } from './services/voice';
import { api } from './services/api';
import { Mic, MicOff, Home, CheckSquare, Moon, BookOpen, MessageCircle } from 'lucide-react';

const USER_ID = localStorage.getItem('jarvis_user_id') || 'user-' + Date.now();
localStorage.setItem('jarvis_user_id', USER_ID);

export default function App() {
  const [user, setUser] = useState(null);
  const [listening, setListening] = useState(false);
  const location = useLocation();

  useEffect(() => {
    api.upsertProfile(USER_ID, {
      name: localStorage.getItem('jarvis_user_name') || 'Student',
      city: localStorage.getItem('jarvis_city') || 'Dhaka',
      country: localStorage.getItem('jarvis_country') || 'Bangladesh',
    }).then(setUser).catch(() => {
      api.getProfile(USER_ID).then(setUser).catch(console.error);
    });
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const voiceController = new VoiceController({
    onResult: async (text) => {
      setListening(false);
      try {
        const result = await api.chatWithAI(text, USER_ID);
        if (result.reply) {
          voiceController.speak(result.reply);
        }
      } catch (e) {
        console.error('Voice processing error:', e);
      }
    },
    onStart: () => setListening(true),
    onEnd: () => setListening(false),
  });

  const toggleVoice = () => {
    if (listening) {
      voiceController.stop();
    } else {
      voiceController.start();
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/prayers', icon: Moon, label: 'Prayers' },
    { path: '/study', icon: BookOpen, label: 'Study' },
    { path: '/chat', icon: MessageCircle, label: 'AI Chat' },
  ];

  return (
    <div className="min-h-screen bg-jarvis-dark flex flex-col">
      <header className="bg-jarvis-card/80 backdrop-blur-sm border-b border-jarvis-accent/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-jarvis-accent to-teal-500 rounded-xl flex items-center justify-center font-bold text-lg text-white">
              J
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-jarvis-accent to-teal-400 bg-clip-text text-transparent">
                Jarvis AI Assistant
              </h1>
              {user && <p className="text-xs text-jarvis-muted">Assalamualaikum, {user.name}</p>}
            </div>
          </div>
          <button
            onClick={toggleVoice}
            className={`p-3 rounded-full transition-all ${
              listening
                ? 'bg-jarvis-accent text-white listening-pulse'
                : 'bg-jarvis-card hover:bg-jarvis-accent/20 text-jarvis-muted'
            }`}
          >
            {listening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <nav className="hidden md:flex flex-col w-16 lg:w-56 bg-jarvis-card/50 border-r border-jarvis-accent/10 p-2 lg:p-4 gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'bg-jarvis-accent/20 text-jarvis-accent'
                  : 'text-jarvis-muted hover:bg-jarvis-card hover:text-jarvis-text'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard userId={USER_ID} user={user} />} />
            <Route path="/tasks" element={<TaskBoard userId={USER_ID} />} />
            <Route path="/prayers" element={<PrayerWidget userId={USER_ID} user={user} />} />
            <Route path="/study" element={<StudyPlanner userId={USER_ID} />} />
            <Route path="/chat" element={<ChatInterface userId={USER_ID} />} />
          </Routes>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-jarvis-card/90 backdrop-blur-sm border-t border-jarvis-accent/10 px-2 py-1 z-50">
        <div className="flex justify-around">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                location.pathname === item.path
                  ? 'text-jarvis-accent'
                  : 'text-jarvis-muted'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
