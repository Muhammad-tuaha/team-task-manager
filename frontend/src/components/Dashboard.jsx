import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [activeModal, setActiveModal] = useState(null); // { type: 'create' | 'edit', task?: obj }
  
  // Quick Create Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState({ teamId: '', email: '' });

  useEffect(() => {
    fetchTeams();
    fetchUpcoming();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedTeam, assigneeFilter, search]);

  const fetchTeams = async () => {
    try { const res = await axios.get('/teams'); setTeams(res.data.teams); } catch (e) { console.error(e); }
  };

  const fetchUpcoming = async () => {
    try { const res = await axios.get('/tasks/upcoming'); setUpcoming(res.data.upcoming); } catch (e) { console.error(e); }
  };

  const fetchTasks = async () => {
    try {
      const params = {};
      if (selectedTeam) params.team_id = selectedTeam;
      if (assigneeFilter) params.assignee_id = assigneeFilter;
      if (search) params.search = search;
      const res = await axios.get('/tasks', { params });
      setTasks(res.data.tasks);
    } catch (e) { console.error(e); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await axios.post('/teams', { name: newTeamName });
      setNewTeamName('');
      fetchTeams();
    } catch (e) { alert(e.response?.data?.error || 'Failed to create team'); }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.email.trim() || !inviteEmail.teamId) return;
    try {
      await axios.post(`/teams/${inviteEmail.teamId}/members`, { email: inviteEmail.email });
      alert('Member added successfully (Stub logic executed)');
      setInviteEmail({ teamId: '', email: '' });
    } catch (e) { alert(e.response?.data?.error || 'Failed to add member'); }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`/tasks/${id}`);
      fetchTasks();
      fetchUpcoming();
    } catch (e) { alert(e.response?.data?.error || 'Failed to delete task'); }
  };

  return (
    <div className="min-h-screen bg-slate-soft text-ink font-body">
      {/* Navbar Layer */}
      <nav className="bg-white border-b border-slate-border px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-1.5">✓ Taskly</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-ink-light bg-slate-soft px-3 py-1.5 rounded-lg border border-slate-border">
            {user?.name}
          </span>
          <button onClick={logout} className="btn-secondary text-sm">Logout</button>
        </div>
      </nav>

      {/* Main Grid Wrapper Layout */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 animate-slide-up">
        
        {/* Left Sidebar Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Due-Date Notifications Box */}
          <div className="card p-4 bg-amber-muted border-amber-task/30">
            <h3 className="text-base font-bold text-amber-task mb-2 flex items-center gap-1">⏰ Due Reminders</h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-muted">No assignments due within 48h.</p>
            ) : (
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {upcoming.map(t => (
                  <li key={t.id} className="text-xs border-b border-amber-task/10 pb-1.5 last:border-0">
                    <p className="font-semibold text-ink truncate">{t.title}</p>
                    <p className="text-[10px] text-slate-muted">{t.team_name} • {new Date(t.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Teams Construction Module */}
          <div className="card p-4 space-y-4">
            <h3 className="text-lg font-bold text-ink">My Teams</h3>
            <form onSubmit={handleCreateTeam} className="space-y-2">
              <input 
                type="text" className="input-field py-2" placeholder="New Team Name" 
                value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
              />
              <button type="submit" className="btn-primary text-xs py-2 w-full">Create Team</button>
            </form>

            <div className="border-t border-slate-border pt-3 space-y-2">
              <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wider">Add Member</label>
              <form onSubmit={handleInviteMember} className="space-y-2">
                <select 
                  className="input-field text-xs py-2" value={inviteEmail.teamId}
                  onChange={e => setInviteEmail({...inviteEmail, teamId: e.target.value})}
                >
                  <option value="">Select Team</option>
                  {teams.map(t => t.my_role === 'owner' && <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input 
                  type="email" className="input-field py-2 text-xs" placeholder="colleague@email.com"
                  value={inviteEmail.email} onChange={e => setInviteEmail({...inviteEmail, email: e.target.value})}
                />
                <button type="submit" className="btn-secondary text-xs py-2 w-full">Send Access</button>
              </form>
            </div>
          </div>
        </div>

        {/* Central Operations/Dashboard Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Operations Bar Filters */}
          <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select 
                className="input-field text-xs max-w-xs bg-slate-soft" value={selectedTeam} 
                onChange={e => { setSelectedTeam(e.target.value); setAssigneeFilter(''); }}
              >
                <option value="">All Teams Filter</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <input 
                type="text" className="input-field text-xs max-w-xs" placeholder="Search tasks..." 
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button onClick={() => setActiveModal({ type: 'create' })} className="btn-primary text-sm whitespace-nowrap w-full md:w-auto">
              + Add New Task
            </button>
          </div>

          {/* Core Tasks Iteration Matrix */}
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="card p-12 text-center text-slate-muted">No task pipelines match the criteria.</div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="card p-5 flex justify-between items-start hover:border-slate-muted/40 transition-all duration-150">
                  <div className="space-y-1.5 max-w-[80%]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-accent bg-accent-muted px-2 py-0.5 rounded-md">{task.team_name}</span>
                      <h4 className="text-base font-semibold text-ink leading-tight">{task.title}</h4>
                    </div>
                    {task.description && <p className="text-sm text-slate-muted line-clamp-2">{task.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-ink-light pt-1">
                      <span className={`badge ${task.status === 'done' ? 'bg-green-50 text-green-700' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`badge ${task.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-slate-soft text-slate-muted'}`}>
                        {task.priority} priority
                      </span>
                      {task.assignee_name && <span className="font-medium text-slate-muted">👤 {task.assignee_name}</span>}
                      {task.due_date && <span className="text-slate-muted">📅 {new Date(task.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button onClick={() => setActiveModal({ type: 'edit', task })} className="btn-ghost text-xs p-1">Edit</button>
                    <button onClick={() => handleDeleteTask(task.id)} className="btn-ghost text-xs p-1 text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {activeModal && (
        <TaskModal 
          mode={activeModal.type} task={activeModal.task} teams={teams}
          onClose={() => setActiveModal(null)} onRefresh={() => { fetchTasks(); fetchUpcoming(); }}
        />
      )}
    </div>
  );
}