import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { LogOut, Upload, Trash2, Check, TriangleAlert } from 'lucide-react';
import { toast } from '../components/Toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [avatar, setAvatar]     = useState(user?.avatar || '');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [savedName, setSavedName] = useState(user?.fullname || '');
  const [savedAvatar, setSavedAvatar] = useState(user?.avatar || '');

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
      setMessage('✗ Ukuran file terlalu besar. Maksimal 5 MB.');
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
      setSavedName(fullname);
      setSavedAvatar(avatar);
      setMessage('✓ Profil berhasil diperbarui.');
      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      setMessage('✗ Gagal memperbarui profil: ' + error.message);
      toast.error('Gagal memperbarui profil', { detail: error.message });
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

  const ok = message.startsWith('✓');
  const dirty = fullname !== savedName || avatar !== savedAvatar;
  const displayName = fullname || user?.username || '';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Baru saja';

  return (
    <div className="k-page" style={{ padding: '26px 34px 56px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ fontSize: 11.5, color: 'var(--k-faint)', marginBottom: 5 }}>
          Home <span style={{ margin: '0 3px' }}>›</span>
          <span style={{ color: 'var(--k-link)', fontWeight: 600 }}>Pengaturan</span>
        </div>

        <h1 className="k-display" style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 600 }}>
          Pengaturan
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--k-muted)' }}>
          Atur profil dan akun Kanbify kamu.
        </p>

        <div
          className="k-split"
          style={{
            display: 'grid',
            gridTemplateColumns: '280px minmax(0, 1fr)',
            gap: 20,
            alignItems: 'start'
          }}
        >
          {/* IDENTITAS */}

          <aside className="k-panel" style={{ padding: '26px 22px', textAlign: 'center' }}>
            <div
              style={{
                width: 112,
                height: 112,
                margin: '0 auto 16px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#fde6d3',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
                fontWeight: 700,
                boxShadow: '0 0 0 4px #fff, 0 0 0 6px var(--k-orange)'
              }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Foto profil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                displayName[0]?.toUpperCase()
              )}
            </div>

            <div className="k-display" style={{ fontSize: 19, fontWeight: 600 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--k-muted)', marginTop: 3 }}>
              @{user?.username}
            </div>

            <label
              htmlFor="avatar-input"
              className="k-btn"
              style={{ marginTop: 18, justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}
            >
              <Upload size={14} /> Ganti foto
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p style={{ fontSize: 11, color: 'var(--k-faint)', margin: '8px 0 0' }}>
              JPG atau PNG, maksimal 5 MB.
            </p>

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--k-line-soft)',
                textAlign: 'left'
              }}
            >
              <div className="k-eyebrow">Bergabung sejak</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{memberSince}</div>
            </div>
          </aside>

          {/* FORM */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <form onSubmit={handleSubmit} className="k-panel" style={{ padding: '22px 24px' }}>
              <h2 className="k-display" style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600 }}>
                Profil
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label className="k-field-label" htmlFor="fullname">
                  Nama lengkap
                </label>
                <input
                  id="fullname"
                  className="k-input"
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Nama yang tampil di board"
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 18
                }}
              >
                {[
                  ['Username', user?.username],
                  ['Email', user?.email]
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="k-eyebrow" style={{ marginBottom: 5 }}>{label}</div>
                    <div
                      style={{
                        fontSize: 13,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#f7f6f1',
                        color: 'var(--k-ink-2)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={value}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {message && (
                <div
                  role="status"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: ok ? '#edf8f1' : '#fff1f0',
                    border: `1px solid ${ok ? '#c3e6d1' : '#fbd0cc'}`,
                    color: ok ? '#1f7a48' : '#b42318',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 12.5,
                    marginBottom: 16
                  }}
                >
                  {ok ? <Check size={15} /> : <TriangleAlert size={15} />}
                  {message.replace(/^[✓✗]\s*/, '')}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                {dirty && !loading && (
                  <span style={{ fontSize: 12, color: 'var(--k-muted)' }}>
                    Ada perubahan yang belum disimpan
                  </span>
                )}
                <button
                  type="submit"
                  className="k-btn k-btn-primary"
                  disabled={loading || !dirty}
                  style={{ opacity: loading || !dirty ? 0.55 : 1, cursor: loading || !dirty ? 'default' : 'pointer' }}
                >
                  {loading ? 'Menyimpan...' : 'Simpan perubahan'}
                </button>
              </div>
            </form>

            <section
              className="k-panel"
              style={{
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap'
              }}
            >
              <div>
                <h2 className="k-display" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                  Sesi
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--k-muted)' }}>
                  Keluar dari Kanbify di perangkat ini.
                </p>
              </div>
              <button type="button" className="k-btn" onClick={handleLogout}>
                <LogOut size={15} /> Keluar
              </button>
            </section>

            <section
              className="k-panel"
              style={{
                padding: '18px 24px',
                borderColor: '#f3cbc6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap'
              }}
            >
              <div style={{ maxWidth: 380 }}>
                <h2 className="k-display" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#9b2c22' }}>
                  Hapus akun
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--k-muted)', lineHeight: 1.5 }}>
                  Akun dan seluruh tugasmu terhapus permanen. Tindakan ini tidak bisa dibatalkan.
                </p>
              </div>
              <button
                type="button"
                className="k-btn"
                onClick={handleDeleteAccount}
                disabled={loading}
                style={{ background: '#d6453d', borderColor: '#d6453d', color: '#fff' }}
              >
                <Trash2 size={15} /> Hapus akun
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
