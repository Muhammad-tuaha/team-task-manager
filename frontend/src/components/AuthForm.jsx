import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function AuthForm({ isLogin }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0] || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-soft px-4 py-12 animate-fade-in">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold text-accent tracking-tight">✓ Taskly</span>
          <p className="mt-2 text-sm text-slate-muted">
            {isLogin ? 'Sign in to access your team workflows' : 'Create an account to manage team tasks'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-light mb-1.5">Full Name</label>
              <input
                type="text" required className="input-field" placeholder="John Doe"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-light mb-1.5">Email Address</label>
            <input
              type="email" required className="input-field" placeholder="you@example.com"
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-light mb-1.5">Password</label>
            <input
              type="password" required className="input-field" placeholder="••••••••"
              value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm border-t border-slate-border pt-4">
          <span className="text-slate-muted">{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <Link to={isLogin ? '/register' : '/login'} className="text-accent hover:underline font-medium">
            {isLogin ? 'Register here' : 'Log in here'}
          </Link>
        </div>
      </div>
    </div>
  );
}