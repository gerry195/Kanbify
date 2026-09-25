import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export default function RegisterPage({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username || !email || !password) {
        throw new Error('Please fill all fields');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const result = await api.register(username, email, password, fullname);
      api.setToken(result.token);
      login(result.user, result.token);
    } catch (err) {
      setError(err.message || 'Registration failed');
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 40,
        width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 28, color: '#667eea', margin: '0 0 8px 0' }}>Kanbify</h1>
          <p style={{ fontSize: 14, color: '#999', margin: 0 }}>Create New Account</p>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>
              Full Name (Optional)
            </label>
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Your full name"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 13,
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 13,
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 13,
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 13,
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              border: '1px solid #fcc',
              color: '#c33',
              padding: 10,
              borderRadius: 6,
              fontSize: 12,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <span style={{ color: '#999' }}>Already have an account? </span>
          <button
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13
            }}
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}
