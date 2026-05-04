import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Moon, Sun, MapPin } from 'lucide-react';

const prayerIcons = {
  fajr: <Sun className="w-5 h-5" />,
  dhuhr: <Sun className="w-5 h-5" />,
  asr: <Sun className="w-5 h-5" />,
  maghrib: <Moon className="w-5 h-5" />,
  isha: <Moon className="w-5 h-5" />,
};

const prayerGradients = {
  fajr: 'from-orange-500/20 to-amber-500/10',
  dhuhr: 'from-yellow-500/20 to-orange-500/10',
  asr: 'from-amber-500/20 to-yellow-500/10',
  maghrib: 'from-teal-500/20 to-cyan-500/10',
  isha: 'from-blue-500/20 to-slate-500/10',
};

export default function PrayerWidget({ userId, user }) {
  const [prayers, setPrayers] = useState([]);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [city, setCity] = useState(user?.city || 'Dhaka');
  const [country, setCountry] = useState(user?.country || 'Bangladesh');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadPrayers();
    loadPrayerTimes();
  }, [userId, city, country]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (nextPrayer) {
        const [h, m] = nextPrayer.time.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(h, m, 0);
        const diff = prayerTime - new Date();
        if (diff > 0) {
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown('Time has passed');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  const loadPrayerTimes = async () => {
    try {
      const data = await api.fetchPrayerTimes(city, country);
      setPrayerTimes(data);
    } catch (e) {
      console.error('Prayer times error:', e);
    }
  };

  const loadPrayers = async () => {
    try {
      let data = await api.getTodayPrayers(userId);

      if (data.length === 0 && prayerTimes) {
        const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const records = [];
        for (const name of prayerNames) {
          const record = await api.createPrayerRecord(userId, name, prayerTimes[name]);
          records.push(record);
        }
        data = records;
      }

      setPrayers(data);

      const now = new Date();
      const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      for (const name of prayerOrder) {
        const prayer = data.find(p => p.name === name);
        if (prayer && !prayer.completed) {
          const [h, m] = prayer.time.split(':').map(Number);
          const prayerTime = new Date();
          prayerTime.setHours(h, m, 0);
          if (prayerTime > now) {
            setNextPrayer({ name, time: prayer.time, id: prayer.id });
            break;
          }
        }
      }
    } catch (e) {
      console.error('Load prayers error:', e);
    }
  };

  const markComplete = async (prayer) => {
    try {
      await api.updatePrayer(prayer.id, !prayer.completed);
      loadPrayers();
    } catch (e) {
      console.error('Mark prayer error:', e);
    }
  };

  const saveLocation = () => {
    setEditing(false);
    localStorage.setItem('jarvis_city', city);
    localStorage.setItem('jarvis_country', country);
    loadPrayers();
    loadPrayerTimes();
  };

  const completedCount = prayers.filter(p => p.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Moon className="w-5 h-5" /> Prayer Schedule
        </h2>
        <div className="flex items-center gap-2 text-jarvis-muted text-sm">
          <MapPin className="w-4 h-4" />
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City"
                className="bg-jarvis-dark border border-jarvis-accent/20 rounded px-2 py-1 text-xs w-20"
              />
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="Country"
                className="bg-jarvis-dark border border-jarvis-accent/20 rounded px-2 py-1 text-xs w-20"
              />
              <button onClick={saveLocation} className="text-jarvis-accent hover:underline text-xs">Save</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="hover:text-jarvis-text transition-colors">
              {city}, {country} (change)
            </button>
          )}
        </div>
      </div>

      {nextPrayer && (
        <div className="bg-gradient-to-r from-jarvis-accent/20 to-teal-500/20 border border-jarvis-accent/30 rounded-2xl p-6 text-center">
          <p className="text-jarvis-accent text-sm font-medium uppercase tracking-wide">Next Prayer</p>
          <p className="text-3xl font-bold capitalize mt-2">{nextPrayer.name}</p>
          <p className="text-2xl font-mono text-jarvis-accent mt-1">{nextPrayer.time}</p>
          <p className="text-jarvis-muted mt-2">Time remaining: <span className="text-white font-semibold">{countdown}</span></p>
        </div>
      )}

      <div className="bg-jarvis-card rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm text-jarvis-muted">Progress Today</span>
        <div className="flex items-center gap-3">
          <div className="w-48 h-2 bg-jarvis-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-jarvis-accent to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold">{completedCount}/5</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prayers.map(prayer => (
          <div
            key={prayer.id}
            className={`bg-gradient-to-br ${prayerGradients[prayer.name]} border rounded-xl p-5 transition-all ${
              prayer.completed ? 'border-green-500/30' : 'border-jarvis-accent/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-jarvis-dark/50 rounded-lg">
                  {prayerIcons[prayer.name]}
                </div>
                <div>
                  <h3 className="font-semibold capitalize">{prayer.name}</h3>
                  <p className="text-2xl font-mono font-bold">{prayer.time}</p>
                </div>
              </div>
              <button
                onClick={() => markComplete(prayer)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  prayer.completed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-jarvis-dark/50 text-jarvis-muted hover:bg-jarvis-accent/20 hover:text-jarvis-accent border border-jarvis-accent/10'
                }`}
              >
                {prayer.completed ? 'Done' : 'Mark'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {prayerTimes && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3 text-jarvis-muted">Additional Info</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-jarvis-muted">Sunrise:</span>{' '}
              <span className="font-mono">{prayerTimes.sunrise}</span>
            </div>
            <div>
              <span className="text-jarvis-muted">Date:</span>{' '}
              <span>{prayerTimes.date}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
