import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Check } from 'lucide-react';

export default function TaskBoard({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: 'Personal', priority: 'Medium', dueDate: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks(userId);
      setTasks(data);
    } catch (e) {
      console.error('Load tasks error:', e);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await api.createTask(userId, newTask);
      setNewTask({ title: '', category: 'Personal', priority: 'Medium', dueDate: '' });
      setShowAdd(false);
      loadTasks();
    } catch (e) {
      console.error('Add task error:', e);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await api.updateTask(task.id, { completed: !task.completed });
      loadTasks();
    } catch (e) {
      console.error('Toggle task error:', e);
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (e) {
      console.error('Delete task error:', e);
    }
  };

  const filteredTasks = filter === 'all'
    ? tasks
    : filter === 'pending'
    ? tasks.filter(t => !t.completed)
    : tasks.filter(t => t.completed);

  const columns = [
    { key: 'High', label: 'High Priority', color: 'border-red-500' },
    { key: 'Medium', label: 'Medium Priority', color: 'border-yellow-500' },
    { key: 'Low', label: 'Low Priority', color: 'border-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Task Manager</h2>
        <div className="flex gap-2">
          {['all', 'pending', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                filter === f ? 'bg-jarvis-accent text-white' : 'bg-jarvis-card text-jarvis-muted hover:text-jarvis-text'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-1.5 bg-jarvis-accent hover:bg-jarvis-accentHover rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-5 h-5" /> Add Task
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Task title..."
            value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full bg-jarvis-dark border border-jarvis-accent/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-jarvis-accent"
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={newTask.category}
              onChange={e => setNewTask({ ...newTask, category: e.target.value })}
              className="bg-jarvis-dark border border-jarvis-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-jarvis-accent"
            >
              <option>Personal</option>
              <option>Assignment</option>
              <option>Exam</option>
              <option>Health</option>
              <option>Other</option>
            </select>
            <select
              value={newTask.priority}
              onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
              className="bg-jarvis-dark border border-jarvis-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-jarvis-accent"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="bg-jarvis-dark border border-jarvis-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-jarvis-accent"
            />
            <button
              onClick={addTask}
              className="px-4 py-2 bg-jarvis-accent hover:bg-jarvis-accentHover rounded-lg text-sm font-medium transition-all"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {columns.map(col => {
          const columnTasks = filteredTasks.filter(t => t.priority === col.key);
          return (
            <div key={col.key} className={`bg-jarvis-card/50 rounded-xl border-t-4 ${col.color} p-4`}>
              <h3 className="font-semibold text-sm mb-3">{col.label} ({columnTasks.length})</h3>
              <div className="space-y-2">
                {columnTasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-3 bg-jarvis-dark/50 rounded-lg border border-jarvis-accent/5 transition-all ${
                      task.completed ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleComplete(task)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          task.completed
                            ? 'bg-jarvis-success border-jarvis-success'
                            : 'border-jarvis-muted/50 hover:border-jarvis-accent'
                        }`}
                      >
                        {task.completed && <Check className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-jarvis-muted' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-jarvis-muted">{task.category}</span>
                          {task.due_date && (
                            <span className="text-xs text-jarvis-muted">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-jarvis-muted hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <p className="text-jarvis-muted text-xs text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
