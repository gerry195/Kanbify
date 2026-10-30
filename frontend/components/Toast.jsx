import React, { useSyncExternalStore } from 'react';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';

/*
 * Notifikasi singkat (toast).
 * Dipanggil dari mana saja, tidak perlu hook:
 *   toast.success('Board berhasil dibuat')
 *   toast.error('Gagal menyimpan tugas')
 *   toast.info('Kode undangan disalin')
 */

const DURATION = { success: 3200, info: 3200, error: 5200 };
const MAX_VISIBLE = 4;
const EXIT_MS = 220;

let items = [];
let nextId = 1;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  return items;
}

function dismiss(id) {
  const target = items.find((t) => t.id === id);
  if (!target || target.leaving) return;

  items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();

  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, EXIT_MS);
}

function push(type, message, options = {}) {
  if (!message) return null;

  // Pesan yang sama berturut-turut tidak ditumpuk.
  const dupe = items.find((t) => !t.leaving && t.type === type && t.message === message);
  if (dupe) return dupe.id;

  const id = nextId++;
  items = [...items, { id, type, message, detail: options.detail || '', leaving: false }];

  // Batasi jumlah yang tampil; yang paling lama keluar duluan.
  const visible = items.filter((t) => !t.leaving);
  if (visible.length > MAX_VISIBLE) dismiss(visible[0].id);

  emit();
  setTimeout(() => dismiss(id), options.duration ?? DURATION[type]);

  return id;
}

export const toast = {
  success: (message, options) => push('success', message, options),
  error: (message, options) => push('error', message, options),
  info: (message, options) => push('info', message, options),
  dismiss
};

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info
};

export function ToastViewport() {
  const list = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div className="k-toasts" aria-live="polite" aria-atomic="false">
      {list.map((t) => {
        const Icon = ICONS[t.type];

        return (
          <div
            key={t.id}
            className={`k-toast ${t.type}${t.leaving ? ' leaving' : ''}`}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <span className="k-toast-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={2.2} />
            </span>

            <span className="k-toast-body">
              <span className="k-toast-msg">{t.message}</span>
              {t.detail && <span className="k-toast-detail">{t.detail}</span>}
            </span>

            <button
              type="button"
              className="k-toast-close"
              aria-label="Tutup notifikasi"
              onClick={() => dismiss(t.id)}
            >
              <X size={15} strokeWidth={2.2} />
            </button>

            <span
              className="k-toast-timer"
              style={{ animationDuration: `${DURATION[t.type]}ms` }}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
}
