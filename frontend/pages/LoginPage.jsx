import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import loginBg from '../assets/kanbifyloading.jpg';

const inputWrapperStyle = { position: 'relative', width: '100%', marginBottom: '14px' };

const inputStyle = {
  width: '100%', padding: '14px 45px 14px 42px',
  backgroundColor: '#f1f5f9', border: 'none', borderRadius: '12px',
  boxSizing: 'border-box', fontSize: '14px', color: '#333333', outline: 'none',
};

const inputIconStyle = {
  position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
  color: '#64748b', pointerEvents: 'none', fontSize: '14px'
};

const eyeButtonStyle = {
  position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', padding: 0,
  opacity: 0.4, color: '#64748b', transition: 'opacity 0.2s ease',
};

const mainButtonStyle = {
  backgroundColor: '#9fc5e8', color: '#1e293b', padding: '14px 20px',
  border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%',
  fontWeight: 'bold', fontSize: '15px', marginTop: '10px', transition: 'background-color 0.2s',
};

const sideButtonStyle = {
  backgroundColor: 'transparent', border: '2px solid #ffffff', color: '#ffffff',
  cursor: 'pointer', padding: '10px 45px', borderRadius: '12px',
  fontWeight: 'bold', fontSize: '14px', marginTop: '20px', transition: 'all 0.2s ease',
};

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.024 10.024 0 014.138-4.393M9.542 7C10.3 6.6 11.13 6.4 12 6.4c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 4.39M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
  </svg>
);

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername]       = useState('');
  const [fullname, setFullname]       = useState(''); // ✅ tambah fullname
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const { login } = useAuth();

  const toggleView = (viewStatus) => {
    setIsLoginView(viewStatus);
    setError('');
    setUsername('');
    setFullname('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (isLoginView) {
        // LOGIN
        result = await api.login(username, password);
      } else {
        // REGISTER — ✅ kirim fullname, lalu auto-login
        await api.register(username, email, password, fullname);
        result = await api.login(username, password);
      }
      api.setToken(result.token);
      login(result.user, result.token);
    } catch (err) {
      setError(err.message || (isLoginView ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ──
  const containerStyle = {
    backgroundColor: '#ffffff', borderRadius: '24px',
    boxShadow: '0 14px 28px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.05)',
    position: 'relative', overflow: 'hidden',
    width: '850px', maxWidth: '90%', minHeight: '520px', zIndex: 2,
  };

  const formContainerStyle = {
    position: 'absolute', top: 0, height: '100%', width: '50%',
    transition: 'all 0.6s ease-in-out', display: 'flex',
    flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    padding: '0 50px', boxSizing: 'border-box', backgroundColor: '#ffffff',
  };

  const loginContainerStyle = {
    ...formContainerStyle,
    right: 0, zIndex: isLoginView ? 5 : 1,
    opacity: isLoginView ? 1 : 0,
    transform: isLoginView ? 'translateX(0)' : 'translateX(-100%)',
  };

  const registerContainerStyle = {
    ...formContainerStyle,
    left: 0, zIndex: isLoginView ? 1 : 5,
    opacity: isLoginView ? 0 : 1,
    transform: isLoginView ? 'translateX(100%)' : 'translateX(0)',
  };

  const overlayContainerStyle = {
    position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
    overflow: 'hidden', transition: 'transform 0.6s ease-in-out', zIndex: 100,
    transform: isLoginView ? 'translateX(0)' : 'translateX(100%)',
  };

  const overlayStyle = {
    background: 'linear-gradient(135deg, #7a8560 0%, #636b4d 100%)',
    color: '#ffffff', position: 'relative', height: '100%', width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: isLoginView ? '0 100px 100px 0' : '100px 0 0 100px',
    transition: 'border-radius 0.6s ease-in-out',
  };

  return (
    <div style={{
      backgroundImage: `url(${loginBg})`, backgroundSize: 'cover',
      backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      height: '100vh', width: '100vw', overflow: 'hidden',
      position: 'fixed', margin: 0, padding: 0, top: 0, left: 0,
    }}>
      <div style={containerStyle}>

        {/* ── REGISTER FORM ── */}
        <div style={registerContainerStyle}>
          <form onSubmit={handleAuth} style={{ width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontWeight: '700', color: '#1e293b', marginBottom: '25px', fontSize: '2em' }}>Registration</h1>

            {/* Username */}
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle}>👤</span>
              <input type="text" placeholder="Username" style={inputStyle}
                value={username} onChange={e => setUsername(e.target.value)} required />
            </div>

            {/* ✅ Full Name */}
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle}>📝</span>
              <input type="text" placeholder="Full Name (optional)" style={inputStyle}
                value={fullname} onChange={e => setFullname(e.target.value)} />
            </div>

            {/* Email */}
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle}>✉️</span>
              <input type="email" placeholder="Email" style={inputStyle}
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle}>🔒︎</span>
              <input type={showPassword ? "text" : "password"} placeholder="Password"
                style={inputStyle} value={password}
                onChange={e => setPassword(e.target.value)} required />
              <button type="button" style={eyeButtonStyle}
                onClick={() => setShowPassword(!showPassword)}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {error && !isLoginView && (
              <p style={{ color: '#b91c1c', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '8px', fontSize: '13px', margin: '5px 0' }}>
                ⚠️ {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={mainButtonStyle}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#8faecf'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#9fc5e8'}>
              {loading ? 'Processing...' : 'Register'}
            </button>
          </form>
        </div>

        {/* ── LOGIN FORM ── */}
        <div style={loginContainerStyle}>
          <form onSubmit={handleAuth} style={{ width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontWeight: '700', color: '#1e293b', marginBottom: '25px', fontSize: '2em' }}>Login</h1>

            {/* Username */}
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle}>👤</span>
              {/* ✅ FIX: required={true} bukan required={!isLoginView} */}
              <input type="text" placeholder="Username" style={inputStyle}
                value={username} onChange={e => setUsername(e.target.value)} required />
            </div>

            {/* Password */}
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle}>🔒︎</span>
              {/* ✅ FIX: required={true} */}
              <input type={showPassword ? "text" : "password"} placeholder="Password"
                style={inputStyle} value={password}
                onChange={e => setPassword(e.target.value)} required />
              <button type="button" style={eyeButtonStyle}
                onClick={() => setShowPassword(!showPassword)}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>
                <EyeIcon open={showPassword} />
              </button>
            </div>

            <div style={{ textAlign: 'center', margin: '12px 0 20px 0' }}>
              <span style={{ color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
                onClick={() => alert('Fitur reset password belum tersedia.')}>
                Forgot password
              </span>
            </div>

            {error && isLoginView && (
              <p style={{ color: '#b91c1c', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '8px', fontSize: '13px', margin: '5px 0' }}>
                ⚠️ {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={mainButtonStyle}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#8faecf'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#9fc5e8'}>
              {loading ? 'Processing...' : 'Login'}
            </button>
          </form>
        </div>

        {/* ── OVERLAY ── */}
        <div style={overlayContainerStyle}>
          <div style={overlayStyle}>
            {isLoginView ? (
              <div style={{ padding: '0 40px', textAlign: 'center' }}>
                <h1 style={{ fontWeight: '700', margin: 0, fontSize: '2.2em', color: '#ffffff' }}>Hello, Welcome!</h1>
                <p style={{ fontSize: '14px', color: '#ffffff', opacity: 0.85, margin: '15px 0 10px 0' }}>Don't have an account?</p>
                <button style={sideButtonStyle} onClick={() => toggleView(false)}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#7a8560'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}>
                  Register
                </button>
              </div>
            ) : (
              <div style={{ padding: '0 40px', textAlign: 'center' }}>
                <h1 style={{ fontWeight: '700', margin: 0, fontSize: '2.2em', color: '#ffffff' }}>Hello, Back!</h1>
                <p style={{ fontSize: '14px', color: '#ffffff', opacity: 0.85, margin: '15px 0 10px 0' }}>Already have an account?</p>
                <button style={sideButtonStyle} onClick={() => toggleView(true)}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#7a8560'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}>
                  Login
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}