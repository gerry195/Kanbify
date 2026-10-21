import React, { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import loadingBg from '../assets/kanbifyloading.jpg';

/*
 * Tujuan akhir alur login Google: /auth/callback?code=...
 * Kode sekali pakai (berlaku 60 detik) ditukar dengan token Sanctum,
 * disimpan seperti login biasa, lalu halaman dimuat ulang ke "/".
 */
export default function SocialCallbackPage() {
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // StrictMode menjalankan effect dua kali; kode hanya boleh ditukar sekali.
    if (started.current) return;
    started.current = true;

    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      window.location.replace('/?social_error=' + encodeURIComponent('Kode login tidak ditemukan.'));
      return;
    }

    api.exchangeSocialCode(code)
      .then(({ token, user }) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(user));
        window.location.replace('/');
      })
      .catch((err) => {
        setError(err.message || 'Login Google gagal.');
        setTimeout(() => {
          window.location.replace('/?social_error=' + encodeURIComponent(err.message || 'Login Google gagal.'));
        }, 1500);
      });
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: `url(${loadingBg})`, backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '28px 36px', textAlign: 'center',
        boxShadow: '0 14px 28px rgba(0,0,0,0.12)', color: '#1e293b', maxWidth: 360
      }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>
          {error ? 'Login Google gagal' : 'Menyelesaikan login Google...'}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: error ? '#b91c1c' : '#64748b' }}>
          {error || 'Sebentar, kamu akan diarahkan ke Kanbify.'}
        </div>
      </div>
    </div>
  );
}
