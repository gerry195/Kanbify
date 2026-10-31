import React, { useEffect, useRef } from 'react';
import { STAGE_IMAGE } from '../theme';
import LogoMark from './LogoMark';
import '../splash.css';

/*
 * Splash screen: logo dan slogan. Selesai kalau waktu tayang sudah cukup
 * DAN auth sudah siap, jadi tidak ada penundaan paksa saat auth butuh waktu lebih lama.
 *
 * quick: pemuatan ulang dalam sesi yang sama, tayang lebih singkat.
 */

const FULL_MS = 3400;
const QUICK_MS = 1400;
const REDUCED_MS = 1800;
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
          <LogoMark variant="white" size={44} animate />
          <span className="k-splash-name">Kanbify</span>
        </div>

        <p className="k-splash-tag" aria-hidden={quick ? 'true' : undefined}>
          <span>Move.</span> <span>Track.</span> <span>Done.</span>
        </p>
      </div>
    </div>
  );
}
