import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Play, Pause, RotateCcw, Plus, BarChart3 } from 'lucide-react';

export default function StudyPlanner({ userId }) {
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', examDate: '', weeklyGoal: 5 });
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    loadSubjects();
    loadStats();
  }, [userId]);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        logSession();
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
      setTimerActive(false);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timeLeft]);

  const loadSubjects = async () => {
    try {
      const data = await api.getSubjects(userId);
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].id);
      }
    } catch (e) {
      console.error('Load subjects error:', e);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getStudyStats(userId);
      setStats(data);
    } catch (e) {
      console.error('Load stats error:', e);
    }
  };

  const addSubject = async () => {
    if (!newSubject.name.trim()) return;
    try {
      await api.createSubject(userId, newSubject);
      setNewSubject({ name: '', examDate: '', weeklyGoal: 5 });
      setShowAdd(false);
      loadSubjects();
      loadStats();
    } catch (e) {
      console.error('Add subject error:', e);
    }
  };

  const logSession = async () => {
    if (selectedSubject) {
      try {
        await api.createStudySession(selectedSubject, 25);
        loadSubjects();
        loadStats();
      } catch (e) {
        console.error('Log session error:', e);
      }
    }
  };

  const toggleTimer = () => setTimerActive(!timerActive);

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((isBreak ? 5 * 60 : 25 * 60) - timeLeft) / (isBreak ? 5 * 60 : 25 * 60) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Study Planner</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-jarvis-accent hover:bg-jarvis-accentHover rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-5 h-5" /> Add Subject
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Subject name (e.g. Physics 101)"
            value={newSubject.name}
            onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
            className="w-full bg-jarvis-dark border border-jarvis-accent/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-jarvis-accent"
          />
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={newSubject.examDate}
              onChange={e => setNewSubject({ ...newSubject, examDate: e.target.value })}
              className="bg-jarvis-dark border border-jarvis-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-jarvis-accent"
            />
            <input
              type="number"
              placeholder="Weekly hours goal"
              value={newSubject.weeklyGoal}
              onChange={e => setNewSubject({ ...newSubject, weeklyGoal: parseFloat(e.target.value) })}
              className="bg-jarvis-dark border border-jarvis-accent/20 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:border-jarvis-accent"
            />
            <button
              onClick={addSubject}
              className="px-4 py-2 bg-jarvis-accent hover:bg-jarvis-accentHover rounded-lg text-sm font-medium transition-all"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Pomodoro Timer</h3>

          {subjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full bg-jarvis-dark border border-jarvis-accent/20 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-jarvis-accent"
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}

          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="4" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={isBreak ? '#22c55e' : '#6366f1'}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</span>
                <span className="text-xs text-jarvis-muted mt-1">
                  {isBreak ? 'Break Time' : 'Focus Time'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                timerActive
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-jarvis-accent hover:bg-jarvis-accentHover'
              }`}
            >
              {timerActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />} {timerActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-4 py-3 bg-jarvis-dark hover:bg-jarvis-card rounded-xl transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
          {stats.length === 0 ? (
            <p className="text-jarvis-muted text-sm text-center py-8">Add subjects to start tracking</p>
          ) : (
            <div className="space-y-4">
              {stats.map(stat => {
                const percentage = Math.min(100, (stat.minutesThisWeek / stat.goalMinutes) * 100);
                return (
                  <div key={stat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{stat.name}</span>
                      <span className="text-jarvis-muted">
                        {Math.floor(stat.minutesThisWeek / 60)}h {stat.minutesThisWeek % 60}m / {Math.floor(stat.goalMinutes / 60)}h
                      </span>
                    </div>
                    <div className="h-2 bg-jarvis-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentage >= 100 ? 'bg-green-500' : 'bg-jarvis-accent'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-jarvis-accent/10">
            <h4 className="text-sm font-semibold mb-2">Subjects</h4>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <div
                  key={s.id}
                  className="bg-jarvis-dark/50 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                >
                  <span>{s.name}</span>
                  {s.exam_date && (
                    <span className="text-jarvis-muted text-xs">
                      Exam: {new Date(s.exam_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
