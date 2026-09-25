import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [avatar, setAvatar]     = useState(user?.avatar || '');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');

  const compressAndResizeImage = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        canvas.width = MAX;
        canvas.height = MAX;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64Str); return; }
        const scale = Math.max(MAX / img.width, MAX / img.height);
        const x = (MAX - img.width * scale) / 2;
        const y = (MAX - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage('✗ Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressAndResizeImage(reader.result);
      setAvatar(compressed);
      setMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const updatedUser = await api.updateProfile(fullname, avatar);
      updateUser(updatedUser);
      setMessage('✓ Profile updated successfully');
    } catch (error) {
      setMessage('✗ Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) {
      localStorage.removeItem('authToken');
      if (typeof api.setToken === 'function') api.setToken(null);
      window.location.href = '/';
    }
  };

  // ✅ FIX: pakai api.deleteAccount() bukan api.request('/api/user/profile')
  const handleDeleteAccount = async () => {
    const confirmPertama = confirm("PERINGATAN: Apakah Anda yakin ingin menghapus akun Anda secara PERMANEN? Semua data tugas Anda akan hilang.");
    if (!confirmPertama) return;
    const confirmKedua = confirm("Tindakan ini tidak dapat dibatalkan. Klik OK untuk menghapus permanen.");
    if (!confirmKedua) return;

    setLoading(true);
    setMessage('');
    try {
      await api.deleteAccount();
      alert("Akun Anda telah berhasil dihapus secara permanen.");
      localStorage.removeItem('authToken');
      api.setToken(null);
      window.location.href = '/';
    } catch (error) {
      setMessage('✗ Gagal menghapus akun: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>User Profile</h1>
          <p style={{ fontSize: 14, color: '#999', margin: 0 }}>Manage your account information</p>
        </div>
        <button onClick={handleLogout} style={{
          padding: '8px 16px', background: '#fff', color: '#e53e3e',
          border: '1px solid #fed7d7', borderRadius: 6, fontSize: 13,
          fontWeight: 600, cursor: 'pointer'
        }}
          onMouseEnter={e => e.target.style.background = '#fff5f5'}
          onMouseLeave={e => e.target.style.background = '#fff'}
        >
          Logout
        </button>
      </div>

      {/* Profile card */}
      <div style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#667eea', border: '2px solid #fff',
            boxShadow: '0 0 0 2px #667eea', flexShrink: 0
          }}>
            {avatar ? (
              <img src={avatar} alt="Profile Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            ) : (
              <span style={{ color: 'white', fontSize: 32, fontWeight: 700 }}>
                {(fullname || user?.username)?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#333' }}>{fullname || user?.username}</p>
            <p style={{ fontSize: 13, color: '#999', margin: '4px 0 0 0' }}>@{user?.username}</p>
            <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0 0' }}>{user?.email}</p>
          </div>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: 6, padding: 12, fontSize: 12, color: '#666' }}>
          <p style={{ margin: 0, marginBottom: 4 }}>Member Since</p>
          <p style={{ margin: 0, fontWeight: 600 }}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Just now'}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>Edit Profile</h2>
        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Full Name</label>
            <input type="text" value={fullname} onChange={e => setFullname(e.target.value)}
              placeholder="Your full name"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Avatar Baru</label>
            <input type="file" accept="image/*" onChange={handleFileChange}
              style={{ fontSize: 13, cursor: 'pointer', width: '100%' }} />
            <p style={{ fontSize: 11, color: '#999', margin: '6px 0 0 0' }}>
              Pilih foto dari perangkat Anda. Maksimal 5MB.
            </p>
          </div>

          <div style={{ background: '#f5f5f5', borderRadius: 6, padding: 12, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#666', margin: '0 0 8px 0' }}>Account Information</p>
            <div style={{ fontSize: 12, color: '#999' }}>
              <p style={{ margin: '4px 0' }}>Username: <strong>{user?.username}</strong></p>
              <p style={{ margin: '4px 0' }}>Email: <strong>{user?.email}</strong></p>
            </div>
          </div>

          {message && (
            <div style={{
              background: message.includes('✓') ? '#efe' : '#fee',
              border: `1px solid ${message.includes('✓') ? '#cfc' : '#fcc'}`,
              color: message.includes('✓') ? '#3a3' : '#c33',
              padding: 10, borderRadius: 6, fontSize: 12, marginBottom: 16
            }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px 12px', background: '#667eea',
            color: 'white', border: 'none', borderRadius: 6, fontSize: 13,
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, border: '1px solid #f5c6cb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px 0', color: '#721c24' }}>Danger Zone</h3>
        <p style={{ fontSize: 12, color: '#721c24', margin: '0 0 16px 0' }}>
          Tindakan di bawah ini bersifat permanen dan tidak dapat dipulihkan kembali.
        </p>
        <button type="button" disabled={loading} onClick={handleDeleteAccount} style={{
          width: '100%', padding: '10px 12px', background: '#e53e3e',
          color: 'white', border: 'none', borderRadius: 6, fontSize: 13,
          fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Processing...' : 'Hapus Akun Saya Secara Permanen'}
        </button>
      </div>

    </div>
  );
}