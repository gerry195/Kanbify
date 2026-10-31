import React, { useEffect, useRef } from 'react';
import { STAGE_IMAGE } from '../theme';
import '../splash.css';

/*
 * Splash screen. Satu kartu pindah To Do -> Doing -> Done, sekaligus jadi
 * penanda loading. Selesai kalau animasi sudah tuntas DAN auth sudah siap,
 * jadi tidak ada penundaan paksa saat auth butuh waktu lebih lama.
 *
 * quick: pemuatan ulang dalam sesi yang sama, hanya logo tanpa koreografi.
 */

const FULL_MS = 2000;
const QUICK_MS = 350;
const REDUCED_MS = 700;
const LEAVE_MS = 320;

export default function SplashScreen({ ready, quick, onDone }) {
  const rootRef = useRef(null);
  const timeDone = useRef(false);
  const leaving = useRef(false);
  const readyRef = useRef(ready);
  const onDoneRef = useRef(onDone);

  readyRef.current = ready;
  onDoneRef.current = onDone;

  const tryLeave = () => {
    if (leaving.current || !timeDone.current || !readyRef.current) return;

    leaving.current = true;
    rootRef.current?.classList.add('leaving');
    setTimeout(() => onDoneRef.current?.(), LEAVE_MS);
  };

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const wait = quick ? QUICK_MS : reduced ? REDUCED_MS : FULL_MS;

    const id = setTimeout(() => {
      timeDone.current = true;
      tryLeave();
    }, wait);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quick]);

  useEffect(() => {
    tryLeave();
  }, [ready]);

  return (
    <div
      ref={rootRef}
      className={`k-splash${quick ? ' quick' : ''}`}
      style={{ '--k-stage-image': `url("${STAGE_IMAGE}")` }}
      role="status"
      aria-label="Memuat Kanbify"
    >
      <div className="k-stage-photo" aria-hidden="true" />
      <div className="k-stage-scrim" aria-hidden="true" />

      <div className="k-splash-body">
        <div className="k-splash-brand k-display">
          <span className="k-brand-mark">K</span>
          <span className="k-splash-name">Kanbify</span>
        </div>

        {!quick && (
          <div className="k-splash-board" aria-hidden="true">
            <div className="k-splash-lane"><span>To Do</span></div>
            <div className="k-splash-lane"><span>Doing</span></div>
            <div className="k-splash-lane done"><span>Done</span></div>

            <div className="k-splash-card">
              <i /><i />
              <svg className="k-splash-check" viewBox="0 0 24 24" width="16" height="16" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
          </div>
        )}

        <p className="k-splash-tag" aria-hidden={quick ? 'true' : undefined}>
          <span>Move.</span> <span>Track.</span> <span>Done.</span>
        </p>
      </div>
    </div>
  );
}
