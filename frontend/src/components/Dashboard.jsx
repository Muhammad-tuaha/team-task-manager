import React, { useState, useEffect } from 'react';
import api from '../api/api'; // ✅ FIXED (replace axios)
import { useAuth } from '../context/AuthContext';
import TaskModal from './TaskModal';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  const [selectedTeam, setSelectedTeam] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [search, setSearch] = useState('');

  const [activeModal, setActiveModal] = useState(null);

  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState({ teamId: '', email: '' });

  // ── Initial load ─────────────────────────────
  useEffect(() => {
    fetchTeams();
    fetchUpcoming();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedTeam, assigneeFilter, search]);

  // ── API calls ────────────────────────────────
  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data.teams);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const res = await api.get('/tasks/upcoming');
      setUpcoming(res.data.upcoming);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = {};
      if (selectedTeam) params.team_id = selectedTeam;
      if (assigneeFilter) params.assignee_id = assigneeFilter;
      if (search) params.search = search;

      const res = await api.get('/tasks', { params });
      setTasks(res.data.tasks);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      await api.post('/teams', { name: newTeamName });
      setNewTeamName('');
      fetchTeams();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create team');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.email.trim() || !inviteEmail.teamId) return;

    try {
      await api.post(`/teams/${inviteEmail.teamId}/members`, {
        email: inviteEmail.email
      });

      alert('Member added successfully');
      setInviteEmail({ teamId: '', email: '' });
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to add member');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
      fetchUpcoming();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete task');
    }
  };

  // ── UI ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-soft text-ink font-body">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-border px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold">✓ Taskly</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium bg-slate-soft px-3 py-1 rounded-lg border">
            {user?.name}
          </span>

          <button onClick={logout} className="btn-secondary text-sm">
            Logout
          </button>
        </div>
      </nav>

      {/* Layout */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">

          {/* Upcoming */}
          <div className="card p-4">
            <h3 className="font-bold mb-2">⏰ Due Reminders</h3>

            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-muted">No upcoming tasks</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map(t => (
                  <li key={t.id} className="text-xs">
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-slate-muted">
                      {t.team_name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Teams */}
          <div className="card p-4 space-y-3">
            <h3 className="font-bold">My Teams</h3>

            <form onSubmit={handleCreateTeam} className="space-y-2">
              <input
                className="input-field"
                placeholder="New team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <button className="btn-primary w-full text-xs">
                Create
              </button>
            </form>

            <div className="space-y-2">
              <select
                className="input-field text-xs"
                value={inviteEmail.teamId}
                onChange={(e) =>
                  setInviteEmail({ ...inviteEmail, teamId: e.target.value })
                }
              >
                <option value="">Select Team</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <input
                className="input-field text-xs"
                placeholder="email"
                value={inviteEmail.email}
                onChange={(e) =>
                  setInviteEmail({ ...inviteEmail, email: e.target.value })
                }
              />

              <button
                onClick={handleInviteMember}
                className="btn-secondary w-full text-xs"
              >
                Invite
              </button>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-3 space-y-4">

          {/* Filters */}
          <div className="card p-4 flex gap-2">
            <input
              className="input-field text-xs"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              onClick={() => setActiveModal({ type: 'create' })}
              className="btn-primary text-sm"
            >
              + Task
            </button>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="card p-4 flex justify-between">

                <div>
                  <h4 className="font-semibold">{task.title}</h4>
                  <p className="text-xs text-slate-muted">
                    {task.team_name}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveModal({ type: 'edit', task })}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal */}
      {activeModal && (
        <TaskModal
          mode={activeModal.type}
          task={activeModal.task}
          teams={teams}
          onClose={() => setActiveModal(null)}
          onRefresh={() => {
            fetchTasks();
            fetchUpcoming();
          }}
        />
      )}
    </div>
  );
}