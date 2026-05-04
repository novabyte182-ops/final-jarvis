import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ChevronRight, Clock, Target, BookOpen } from 'lucide-react';

export default function Dashboard({ userId, user }) {
  const [stats, setStats] = useState({ tasks: 0, prayers: 0, subjects: 0, nextPrayer: null, time: '' });
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const tasks = await api.getTasks(userId, { completed: false });
        const prayers = await api.getTodayPrayers(userId);

        const now = new Date();
        const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        let nextPrayer = null;

        for (const name of prayerNames) {
          const prayer = prayers.find(p => p.name === name);
          if (prayer && !prayer.completed) {
            const [h, m] = prayer.time.split(':').map(Number);
            const prayerTime = new Date();
            prayerTime.setHours(h, m, 0);
            if (prayerTime > now) {
              const diff = prayerTime - now;
              const hours = Math.floor(diff / 3600000);
              const minutes = Math.floor((diff % 3600000) / 60000);
              nextPrayer = { name, time: prayer.time, countdown: `${hours}h ${minutes}m` };
              break;
            }
          }
        }

        setStats({
          tasks: tasks.length,
          prayers: prayers.filter(p => p.completed).length,
          subjects: 0,
          nextPrayer,
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        });

        setRecentTasks(tasks.slice(0, 4));
      } catch (e) {
        console.error('Dashboard load error:', e);
      }
    };

    loadDashboard();
    const timer = setInterval(() => {
      setStats(s => ({
        ...s,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }));
    }, 60000);

    return () => clearInterval(timer);
  }, [userId]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-jarvis-muted text-sm">Assalamualaikum</p>
            <h2 className="text-2xl md:text-3xl font-bold mt-1">{greeting()}, {user?.name || 'Student'}!</h2>
            <p className="text-jarvis-muted mt-1">{stats.time}</p>
          </div>
          {stats.nextPrayer && (
            <div className="bg-jarvis-accent/10 border border-jarvis-accent/20 rounded-xl px-4 py-3">
              <p className="text-jarvis-accent text-sm font-medium">Next Prayer</p>
              <p className="text-xl font-bold capitalize">{stats.nextPrayer.name}</p>
              <p className="text-jarvis-muted text-sm">{stats.nextPrayer.countdown}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Target className="w-5 h-5" />} label="Pending Tasks" value={stats.tasks} color="blue" link="/tasks" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Prayers Done" value={`${stats.prayers}/5`} color="green" link="/prayers" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Subjects" value={stats.subjects} color="teal" link="/study" />
        <div className="bg-jarvis-card rounded-xl p-4 flex flex-col items-center justify-center border border-jarvis-accent/10">
          <div className="text-2xl font-bold text-jarvis-accent">{stats.time}</div>
          <p className="text-jarvis-muted text-xs mt-1">Current Time</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Today's Tasks</h3>
          <Link to="/tasks" className="text-jarvis-accent text-sm flex items-center gap-1 hover:underline">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {recentTasks.length === 0 ? (
          <div className="text-center py-8 text-jarvis-muted">
            <p>No pending tasks! Add one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-jarvis-dark/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-jarvis-muted">{new Date(task.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                  task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <QuickLinkCard title="Prayer Times" description="View and track your daily prayers" link="/prayers" />
        <QuickLinkCard title="Study Planner" description="Plan sessions and track progress" link="/study" />
        <QuickLinkCard title="AI Chat" description="Ask Jarvis anything" link="/chat" />
        <QuickLinkCard title="Task Manager" description="Organize your tasks and deadlines" link="/tasks" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, link }) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    teal: 'bg-teal-500/20 text-teal-400',
  };
  return (
    <Link to={link} className="bg-jarvis-card rounded-xl p-4 flex flex-col items-center justify-center border border-jarvis-accent/10 hover:border-jarvis-accent/30 transition-all">
      <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-jarvis-muted text-xs">{label}</p>
    </Link>
  );
}

function QuickLinkCard({ title, description, link }) {
  return (
    <Link to={link} className="bg-jarvis-card rounded-xl p-4 border border-jarvis-accent/10 hover:border-jarvis-accent/30 transition-all group">
      <h4 className="font-semibold group-hover:text-jarvis-accent transition-colors">{title}</h4>
      <p className="text-jarvis-muted text-sm mt-1">{description}</p>
    </Link>
  );
}
