import React, { useState } from 'react';
import { api } from '../utils/api';

import { RefreshCw, FolderOpen, X } from 'lucide-react';
import { toast } from './Toast';

export const BOARD_CATEGORIES = [
  'Umum',
  'Desain',
  'Pemasaran',
  'Pengembangan'
];

/*
 * Modal buat board. Dipakai di Dashboard dan Semua Board
 * supaya perilakunya sama di dua halaman.
 */
export default function CreateBoardModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Umum');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category', category);
      if (image) formData.append('cover_image', image);

      await api.createBoard(formData);
      toast.success('Board berhasil dibuat', { detail: name.trim() });

      if (onCreated) await onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal membuat board');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,18,12,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
        boxSizing: 'border-box'
      }}
    >
      <div
        className="k-page"
        style={{
          width: 440,
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 18,
          padding: 26,
          boxSizing: 'border-box',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20
          }}
        >
          <div>
            <h2
              className="k-display"
              style={{ margin: 0, fontSize: 21, fontWeight: 600 }}
            >
              Buat Board Baru
            </h2>
            <p
              style={{
                margin: '5px 0 0',
                fontSize: 12.5,
                color: 'var(--k-muted)'
              }}
            >
              Papan kerja baru untuk tugas dan timmu.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="k-glass"
            style={{ background: '#f5f4ef', border: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label className="k-field-label">Nama Board</label>
            <input
              className="k-input"
              type="text"
              placeholder="Contoh: Proyek Skripsi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="k-field-label">Kategori</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BOARD_CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`k-chip${category === item ? ' on' : ''}`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label className="k-field-label">Gambar Cover</label>

            <input
              id="board-cover-input"
              type="file"
              accept="image/*"
              onChange={pickImage}
              style={{ display: 'none' }}
            />

            {preview ? (
              <div
                style={{
                  position: 'relative',
                  height: 120,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--k-line)'
                }}
              >
                <img
                  src={preview}
                  alt="Pratinjau cover"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <label
                  htmlFor="board-cover-input"
                  className="k-btn"
                  style={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    padding: '6px 10px',
                    fontSize: 11.5
                  }}
                >
                  <RefreshCw size={13} /> Ganti
                </label>
              </div>
            ) : (
              <label
                htmlFor="board-cover-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 92,
                  border: '1.5px dashed #d9d4c6',
                  borderRadius: 12,
                  background: '#faf9f5',
                  color: 'var(--k-muted)',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  gap: 6
                }}
              >
                <FolderOpen size={18} color="var(--k-orange)" />
                Pilih gambar dari perangkat
              </label>
            )}
          </div>

          {error && (
            <div
              style={{
                background: '#fff1f0',
                border: '1px solid #fbd0cc',
                color: '#b42318',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 12,
                marginBottom: 16
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}
          >
            <button type="button" className="k-btn" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="k-btn k-btn-primary"
              disabled={submitting}
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Membuat...' : 'Buat Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
