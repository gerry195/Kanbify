import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { STAGE_IMAGE } from '../theme';

import {
  Home,
  LayoutGrid,
  ChartNoAxesColumnIncreasing,
  CalendarDays,
  Users,
  Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'allboards', label: 'Semua Board', icon: LayoutGrid },
  { id: 'stats', label: 'Statistik Tim', icon: ChartNoAxesColumnIncreasing },
  { id: 'schedule', label: 'Calendar', icon: CalendarDays },
  { id: 'members', label: 'Anggota', icon: Users },
  { id: 'profile', label: 'Pengaturan', icon: Settings }
];

export default function Layout({ currentPage, onNavigate, children }) {
  const { user } = useAuth();
  const displayName = user?.fullname || user?.username || '';

  return (
    <div
      className="k-stage"
      style={{ '--k-stage-image': `url("${STAGE_IMAGE}")` }}
    >
      <div className="k-stage-photo" aria-hidden="true" />
      <div className="k-stage-scrim" aria-hidden="true" />

      <header className="k-topbar">
        <div className="k-pill k-brand">
          <span className="k-brand-mark">K</span>
          <span className="k-brand-name k-display">Kanbify</span>
        </div>

        <nav className="k-pill k-nav" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={`k-nav-item${active ? ' on' : ''}`}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={16} strokeWidth={active ? 2.3 : 1.9} />
                <span className="k-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="k-pill k-user"
          title="Buka profil"
          aria-label={`Buka profil ${displayName}`.trim()}
          onClick={() => onNavigate('profile')}
        >
          <span className="k-user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              displayName[0]?.toUpperCase()
            )}
          </span>

          <span className="k-user-info">
            <span className="k-user-name">{displayName}</span>
            <span className="k-user-mail">{user?.email}</span>
          </span>
        </button>
      </header>

      <main className="k-content">{children}</main>
    </div>
  );
}
