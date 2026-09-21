import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await login(email, password);
      if (!user.isAdmin) {
        setError('Access denied. You need admin privileges to access this dashboard.');
        localStorage.removeItem('admin_token');
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--page-bg)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <ThemeToggle
          style={{
            width: 'auto',
            marginBottom: 0,
            padding: '8px 12px',
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
          }}
        />
      </div>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        background: 'var(--surface)',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '8px',
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--ink)'
        }}>
          WardConnect Admin
        </h1>
        <p style={{
          textAlign: 'center',
          marginBottom: '32px',
          color: 'var(--muted)',
          fontSize: '14px'
        }}>
          Sign in to access the admin dashboard
        </p>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            background: 'var(--danger-bg-2)',
            border: '1px solid var(--danger-border)',
            borderRadius: '8px',
            color: 'var(--danger-text)',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-2)'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-2)'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#9CA3AF' : '#0F766E',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}