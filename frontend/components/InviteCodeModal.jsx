import React, { useState } from 'react';

import { KeyRound, Copy, Check, X } from 'lucide-react';
import { toast } from './Toast';

/*
 * Menampilkan kode undangan board. Hanya admin yang menerima
 * invite_code dari backend, jadi modal ini hanya dibuka oleh admin.
 */
export default function InviteCodeModal({ board, onClose }) {
  const [copied, setCopied] = useState(false);
  const code = board.invite_code || '';

  const copy = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const area = document.createElement('textarea');
      area.value = code;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }

    setCopied(true);
    toast.info('Kode undangan disalin');
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
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
          width: 400,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 18,
          padding: 26,
          boxSizing: 'border-box',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          minHeight: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 18
          }}
        >
          <div>
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#fff5da',
                color: '#c98a06',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}
            >
              <KeyRound size={20} strokeWidth={2} />
            </span>

            <h2
              className="k-display"
              style={{ margin: 0, fontSize: 21, fontWeight: 600 }}
            >
              Kode undangan
            </h2>
            <p
              style={{
                margin: '5px 0 0',
                fontSize: 12.5,
                color: 'var(--k-muted)',
                lineHeight: 1.5
              }}
            >
              Bagikan kode ini ke anggota baru untuk bergabung ke{' '}
              <strong style={{ color: 'var(--k-ink-2)' }}>{board.name}</strong>.
            </p>
          </div>

          <button
            type="button"
            className="k-glass"
            aria-label="Tutup"
            onClick={onClose}
            style={{ background: '#f5f4ef', border: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {code ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 10px 10px 16px',
              border: '1.5px dashed #e3c775',
              background: '#fffaf0',
              borderRadius: 12
            }}
          >
            <span
              className="k-num"
              style={{
                flex: 1,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '0.14em',
                userSelect: 'all'
              }}
            >
              {code}
            </span>

            <button
              type="button"
              className="k-btn k-btn-primary"
              onClick={copy}
              style={{ padding: '9px 13px' }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--k-muted)', margin: 0 }}>
            Board ini belum punya kode undangan.
          </p>
        )}
      </div>
    </div>
  );
}
