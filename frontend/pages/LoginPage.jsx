import React, { useState, useEffect } from 'react';
import { AtSign, User, Mail, Lock, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { STAGE_IMAGE } from '../theme';
import '../login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

function GoogleButton({ label }) {
  const go = () => { window.location.href = `${API_URL}/auth/google/redirect`; };

  return (
    <>
      <div className="k-login-or">atau</div>
      <button type="button" className="k-google" onClick={go}>
        <GoogleLogo />
        {label}
      </button>
    </>
  );
}

function Field({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete, required, trailing }) {
  return (
    <div className="k-field">
      <label htmlFor={id}>{label}</label>
      <div className="k-field-box">
        <span className="k-field-icon" aria-hidden="true"><Icon size={17} strokeWidth={1.9} /></span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />
        {trailing}
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, show, onToggle }) {
  return (
    <Field
      id={id}
      label={label}
      icon={Lock}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder="Kata sandi"
      autoComplete={autoComplete}
      required
      trailing={
        <button
          type="button"
          className="k-eye"
          onClick={onToggle}
          aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          {show ? <EyeOff size={17} strokeWidth={1.9} /> : <Eye size={17} strokeWidth={1.9} />}
        </button>
      }
    />
  );
}

function FormError({ message }) {
  if (!message) return null;

  return (
    <p className="k-login-error" role="alert">
      <TriangleAlert size={15} strokeWidth={2.1} />
      {message}
    </p>
  );
}

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  // Pesan error dari alur login Google (callback mengarahkan ke /?social_error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('social_error');
    if (msg) {
      setError(msg);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const toggleView = (toLogin) => {
    setIsLoginView(toLogin);
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
        result = await api.login(username, password);
      } else {
        // Daftar, lalu langsung masuk
        await api.register(username, email, password, fullname);
        result = await api.login(username, password);
      }

      api.setToken(result.token);
      login(result.user, result.token);
    } catch (err) {
      setError(err.message || (isLoginView ? 'Gagal masuk' : 'Gagal mendaftar'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="k-login" style={{ '--k-stage-image': `url("${STAGE_IMAGE}")` }}>
      <div className="k-stage-photo" aria-hidden="true" />
      <div className="k-stage-scrim" aria-hidden="true" />

      <div className="k-frost k-login-card">
        {/* ---------- DAFTAR ---------- */}
        <form
          className={`k-login-form register${isLoginView ? ' is-hidden' : ''}`}
          onSubmit={handleAuth}
          aria-hidden={isLoginView}
        >
          <h1 className="k-login-title k-display">Buat akun</h1>
          <p className="k-login-lead">Cukup satu menit, lalu buat board pertamamu.</p>

          <Field id="reg-username" label="Username" icon={AtSign} value={username}
            onChange={(e) => setUsername(e.target.value)} placeholder="Username"
            autoComplete="username" required />
          <Field id="reg-fullname" label="Nama lengkap (opsional)" icon={User} value={fullname}
            onChange={(e) => setFullname(e.target.value)} placeholder="Nama lengkap"
            autoComplete="name" />
          <Field id="reg-email" label="Email" icon={Mail} type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com"
            autoComplete="email" required />
          <PasswordField id="reg-password" label="Kata sandi" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
            show={showPassword} onToggle={() => setShowPassword((v) => !v)} />

          {!isLoginView && <FormError message={error} />}

          <button type="submit" className="k-login-submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
          <GoogleButton label="Daftar dengan Google" />

          <button type="button" className="k-login-switch" onClick={() => toggleView(true)}>
            Sudah punya akun? Masuk
          </button>
        </form>

        {/* ---------- MASUK ---------- */}
        <form
          className={`k-login-form login${isLoginView ? '' : ' is-hidden'}`}
          onSubmit={handleAuth}
          aria-hidden={!isLoginView}
        >
          <h1 className="k-login-title k-display">Masuk</h1>
          <p className="k-login-lead">Lanjutkan ke board timmu.</p>

          <Field id="login-username" label="Username" icon={AtSign} value={username}
            onChange={(e) => setUsername(e.target.value)} placeholder="Username"
            autoComplete="username" required />
          <PasswordField id="login-password" label="Kata sandi" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
            show={showPassword} onToggle={() => setShowPassword((v) => !v)} />

          <p className="k-login-soon">Lupa kata sandi? Reset lewat email segera hadir.</p>

          {isLoginView && <FormError message={error} />}

          <button type="submit" className="k-login-submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
          <GoogleButton label="Masuk dengan Google" />

          <button type="button" className="k-login-switch" onClick={() => toggleView(false)}>
            Belum punya akun? Daftar
          </button>
        </form>

        {/* ---------- PANEL ORANYE ---------- */}
        <div className={`k-login-overlay${isLoginView ? '' : ' on-register'}`} aria-hidden="false">
          <div className="k-login-panel">
            <div className="k-login-brand k-display">
              <span className="k-login-mark">K</span>
              Kanbify
            </div>

            {isLoginView ? (
              <>
                <h2 className="k-display">Halo, selamat datang!</h2>
                <p>Belum punya akun? Daftar dan atur tugas timmu di satu papan.</p>
                <button type="button" className="k-login-ghost" onClick={() => toggleView(false)}>
                  Daftar
                </button>
              </>
            ) : (
              <>
                <h2 className="k-display">Selamat datang kembali!</h2>
                <p>Sudah punya akun? Masuk dan lanjutkan pekerjaan timmu.</p>
                <button type="button" className="k-login-ghost" onClick={() => toggleView(true)}>
                  Masuk
                </button>
              </>
            )}

            <div className="k-login-stack" aria-hidden="true">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
