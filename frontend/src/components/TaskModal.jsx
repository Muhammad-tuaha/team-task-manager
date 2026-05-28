import React, { useState, useEffect } from 'react';
import api from '../api/api'; // ✅ FIXED (central API instead of axios)

export default function TaskModal({ mode, task, teams, onClose, onRefresh }) {
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    team_id: '',
    assignee_id: '',
    due_date: ''
  });

  const [members, setMembers] = useState([]);

  // ── Load task / default team ─────────────────────────────
  useEffect(() => {
    if (isEdit && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        team_id: task.team_id || '',
        assignee_id: task.assignee_id || '',
        due_date: task.due_date
          ? new Date(task.due_date).toISOString().substring(0, 16)
          : ''
      });

      fetchTeamMembers(task.team_id);
    } else if (teams.length > 0) {
      setFormData(prev => ({ ...prev, team_id: teams[0].id }));
      fetchTeamMembers(teams[0].id);
    }
  }, [mode, task, teams]);

  // ── Get team members ─────────────────────────────────────
  const fetchTeamMembers = async (teamId) => {
    if (!teamId) return;

    try {
      const res = await api.get(`/teams/${teamId}/members`);
      setMembers(res.data.members);
    } catch (e) {
      console.error(e);
      setMembers([]);
    }
  };

  // ── Change team ──────────────────────────────────────────
  const handleTeamChange = (e) => {
    const id = e.target.value;

    setFormData({
      ...formData,
      team_id: id,
      assignee_id: ''
    });

    fetchTeamMembers(id);
  };

  // ── Submit task ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = { ...formData };

      if (payload.assignee_id === '') payload.assignee_id = null;
      if (payload.due_date === '') payload.due_date = null;

      if (isEdit) {
        await api.patch(`/tasks/${task.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }

      onRefresh();
      onClose();

    } catch (e) {
      alert(
        e.response?.data?.error ||
        'Validation or processing error failed'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-fade-in">

      <div className="card w-full max-w-lg p-6 animate-scale-in">

        <h2 className="text-xl font-bold text-ink mb-4">
          {isEdit ? 'Update Task Metrics' : 'Initialize New Task Pipeline'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">
              Context / Description
            </label>
            <textarea
              className="input-field h-24 resize-none"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-xs uppercase mb-1">
                Status
              </label>
              <select
                className="input-field"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase mb-1">
                Priority
              </label>
              <select
                className="input-field"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

          </div>

          {/* Team + Assignee */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-xs uppercase mb-1">
                Team
              </label>
              <select
                className="input-field"
                disabled={isEdit}
                value={formData.team_id}
                onChange={handleTeamChange}
              >
                <option value="">Select Team</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase mb-1">
                Assignee
              </label>
              <select
                className="input-field"
                value={formData.assignee_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assignee_id: e.target.value
                  })
                }
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs uppercase mb-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              className="input-field"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>

            <button type="submit" className="btn-primary text-sm">
              {isEdit ? 'Save Changes' : 'Launch Task'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}