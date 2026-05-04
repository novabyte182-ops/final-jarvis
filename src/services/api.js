import { supabase } from '../lib/supabase';

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getEdgeFunctionUrl(slug) {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${slug}`;
}

function edgeHeaders() {
  return {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export const api = {
  // Tasks
  async getTasks(userId, { completed, category, priority } = {}) {
    let query = supabase.from('tasks').select('*').eq('user_id', userId).order('priority').order('due_date');
    if (completed !== undefined) query = query.eq('completed', completed);
    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createTask(userId, { title, category = 'Personal', priority = 'Medium', dueDate }) {
    const { data, error } = await supabase.from('tasks').insert({
      user_id: userId,
      title,
      category,
      priority,
      due_date: dueDate || new Date().toISOString().split('T')[0],
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateTask(taskId, updates) {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', taskId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteTask(taskId) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  },

  // Prayers
  async getTodayPrayers(userId) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('prayer_records').select('*').eq('user_id', userId).eq('date', today);
    if (error) throw error;
    return data || [];
  },

  async createPrayerRecord(userId, name, time) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('prayer_records').insert({
      user_id: userId,
      name,
      time,
      date: today,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updatePrayer(prayerId, completed) {
    const { data, error } = await supabase.from('prayer_records').update({ completed }).eq('id', prayerId).select().single();
    if (error) throw error;
    return data;
  },

  // Prayer times (edge function)
  async fetchPrayerTimes(city, country) {
    const res = await fetch(`${getEdgeFunctionUrl('prayer-times')}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`, {
      headers: edgeHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch prayer times');
    return res.json();
  },

  // Study
  async getSubjects(userId) {
    const { data, error } = await supabase.from('subjects').select('*, study_sessions(*)').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async createSubject(userId, { name, examDate, weeklyGoal }) {
    const { data, error } = await supabase.from('subjects').insert({
      user_id: userId,
      name,
      exam_date: examDate || null,
      weekly_goal: weeklyGoal || 5.0,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async createStudySession(subjectId, duration) {
    const { data, error } = await supabase.from('study_sessions').insert({
      subject_id: subjectId,
      duration,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async getStudyStats(userId) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('name, weekly_goal, exam_date, study_sessions!inner(duration, date)')
      .eq('user_id', userId)
      .gte('study_sessions.date', weekAgo.toISOString());

    if (error) throw error;

    return (subjects || []).map(s => ({
      name: s.name,
      minutesThisWeek: (s.study_sessions || []).reduce((sum, ss) => sum + ss.duration, 0),
      goalMinutes: s.weekly_goal * 60,
      examDate: s.exam_date,
    }));
  },

  // AI Chat (edge function)
  async chatWithAI(message, userId) {
    const res = await fetch(getEdgeFunctionUrl('ai-chat'), {
      method: 'POST',
      headers: edgeHeaders(),
      body: JSON.stringify({ message, userId }),
    });
    if (!res.ok) throw new Error('AI chat failed');
    const data = await res.json();
    return data;
  },

  // Profile
  async getProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsertProfile(userId, { name, city, country }) {
    const { data, error } = await supabase.from('profiles').upsert({
      id: userId,
      name: name || 'Student',
      city: city || 'Dhaka',
      country: country || 'Bangladesh',
    }).select().single();
    if (error) throw error;
    return data;
  },
};
