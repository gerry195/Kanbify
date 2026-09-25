import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import {
  Home,
  LayoutGrid,
  ChartNoAxesColumnIncreasing,
  CalendarDays,
  Users,
  Settings,
  Menu
} from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home
  },
  {
    id: 'allboards',
    label: 'Semua Board',
    icon: LayoutGrid
  },
  {
    id: 'stats',
    label: 'Statistik Tim',
    icon: ChartNoAxesColumnIncreasing
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: CalendarDays
  },
  {
    id: 'members',
    label: 'Anggota',
    icon: Users
  },
  {
    id: 'profile',
    label: 'Pengaturan',
    icon: Settings
  }
];

export default function Layout({
  currentPage,
  onNavigate,
  breadcrumb,
  children
}) {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#f4f3ee',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative'
      }}
    >

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        style={{
          width: sidebarOpen ? 232 : 68,
          minWidth: sidebarOpen ? 232 : 68,
          height: '100vh',

          background: '#181818',

          display: 'flex',
          flexDirection: 'column',

          overflow: 'hidden',

          transition:
            'width .22s ease, min-width .22s ease',

          whiteSpace: 'nowrap',

          flexShrink: 0
        }}
      >

        {/* =================================================
            SIDEBAR HEADER / LOGO
            ================================================= */}

        <div
          style={{
            height: 70,

            display: 'flex',
            alignItems: 'center',

            justifyContent:
              sidebarOpen
                ? 'flex-start'
                : 'center',

            padding:
              sidebarOpen
                ? '16px 20px'
                : '16px 0',

            boxSizing: 'border-box',

            flexShrink: 0
          }}
        >

          {/* Logo K */}
          <div
            style={{
              width: 34,
              height: 34,

              borderRadius: 9,

              background: '#f97316',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              color: '#fff',

              fontSize: 17,
              fontWeight: 800,

              flexShrink: 0
            }}
          >
            K
          </div>

          {/* Nama Kanbify */}
          <div
            style={{
              marginLeft: 10,

              opacity:
                sidebarOpen
                  ? 1
                  : 0,

              width:
                sidebarOpen
                  ? 'auto'
                  : 0,

              overflow: 'hidden',

              transition:
                'opacity .15s ease',

              color: '#fff',

              fontSize: 17,
              fontWeight: 700,

              letterSpacing: '-0.3px'
            }}
          >
            Kanbify
          </div>

        </div>


        {/* =================================================
            NAVIGATION
            ================================================= */}

        <nav
          style={{
            flex: 1,
            minHeight: 0,

            padding:
              sidebarOpen
                ? '10px 12px'
                : '10px 10px',

            display: 'flex',
            flexDirection: 'column',

            gap: 4,

            overflowY: 'auto',
            overflowX: 'hidden',

            boxSizing: 'border-box'
          }}
        >

          {NAV_ITEMS.map((item) => {

            const active =
              currentPage === item.id;

            const Icon = item.icon;

            return (
              <button
                key={item.id}

                onClick={() =>
                  onNavigate(item.id)
                }

                title={
                  sidebarOpen
                    ? undefined
                    : item.label
                }

                style={{
                  display: 'flex',
                  alignItems: 'center',

                  justifyContent:
                    sidebarOpen
                      ? 'flex-start'
                      : 'center',

                  gap: 10,

                  padding:
                    sidebarOpen
                      ? '10px 12px'
                      : '10px 0',

                  borderRadius: 9,

                  border: 'none',

                  background:
                    active
                      ? '#f97316'
                      : 'transparent',

                  color:
                    active
                      ? '#fff'
                      : '#a3a3a3',

                  fontSize: 13.5,

                  fontWeight:
                    active
                      ? 600
                      : 500,

                  cursor: 'pointer',

                  textAlign: 'left',

                  width: '100%',

                  minHeight: 40,

                  transition:
                    'background .15s, color .15s',

                  flexShrink: 0,

                  boxSizing: 'border-box'
                }}

                onMouseOver={(e) => {
                  if (!active) {
                    e.currentTarget.style.background =
                      '#242424';

                    e.currentTarget.style.color =
                      '#fff';
                  }
                }}

                onMouseOut={(e) => {
                  if (!active) {
                    e.currentTarget.style.background =
                      'transparent';

                    e.currentTarget.style.color =
                      '#a3a3a3';
                  }
                }}
              >

                {/* Icon */}
                <span
                  style={{
                    width: 20,

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    flexShrink: 0
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={
                      active
                        ? 2.3
                        : 1.8
                    }
                  />
                </span>


                {/* Nama menu */}
                <span
                  style={{
                    opacity:
                      sidebarOpen
                        ? 1
                        : 0,

                    width:
                      sidebarOpen
                        ? 'auto'
                        : 0,

                    overflow: 'hidden',

                    transition:
                      'opacity .15s ease',

                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
                </span>

              </button>
            );

          })}

        </nav>


        {/* =================================================
            USER FOOTER
            ================================================= */}

<div
  onClick={() =>
    onNavigate('profile')
  }

  title={
    sidebarOpen
      ? 'Buka profil'
      : 'Profil'
  }

  style={{
    margin: sidebarOpen
      ? '12px'
      : '12px 0',

    width: sidebarOpen
      ? 'auto'
      : '100%',

    padding: sidebarOpen
      ? '10px 12px'
      : '10px 0',

    borderRadius: 12,

    background: '#242424',

    display: 'flex',
    alignItems: 'center',

    justifyContent:
      sidebarOpen
        ? 'flex-start'
        : 'center',

    gap: 10,

    cursor: 'pointer',

    flexShrink: 0,

    boxSizing: 'border-box',

    transition:
      'margin .22s ease, padding .22s ease'
  }}
>

          {/* =================================================
              AVATAR
              ================================================= */}

          <div
            style={{
              width: 34,
              height: 34,

              borderRadius: '50%',

              overflow: 'hidden',

              flexShrink: 0,

              background: '#f97316',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              color: '#fff',

              fontWeight: 700,
              fontSize: 13
            }}
          >

            {user?.avatar ? (

              <img
                src={user.avatar}
                alt="avatar"

                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

            ) : (

              (
                user?.fullname ||
                user?.username
              )?.[0]?.toUpperCase()

            )}

          </div>


          {/* =================================================
              USER INFO
              Hanya tampil ketika sidebar terbuka
              ================================================= */}

          <div
            style={{
              overflow: 'hidden',

              minWidth: 0,

              opacity:
                sidebarOpen
                  ? 1
                  : 0,

              width:
                sidebarOpen
                  ? 'auto'
                  : 0,

              transition:
                'opacity .15s ease'
            }}
          >

            <div
              style={{
                color: '#fff',

                fontSize: 12.5,

                fontWeight: 600,

                whiteSpace: 'nowrap',

                textOverflow: 'ellipsis',

                overflow: 'hidden'
              }}
            >
              {user?.fullname ||
                user?.username}
            </div>


            <div
              style={{
                color: '#8a8a8a',

                fontSize: 11,

                whiteSpace: 'nowrap',

                textOverflow: 'ellipsis',

                overflow: 'hidden'
              }}
            >
              {user?.email}
            </div>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN AREA
          ===================================================== */}

      <main
        style={{
          flex: 1,

          minWidth: 0,
          minHeight: 0,

          height: '100vh',

          display: 'flex',
          flexDirection: 'column',

          overflow: 'hidden',

          position: 'relative'
        }}
      >

        {/* =================================================
            TOP BAR
            Hamburger berada DI AREA PAGE,
            bukan di sidebar.
            ================================================= */}

        <header
          style={{
            height: 58,
            minHeight: 58,

            display: 'flex',
            alignItems: 'center',

            padding: '0 18px',

            boxSizing: 'border-box',

            background: '#f4f3ee',

            borderBottom:
              '1px solid rgba(0,0,0,0.04)',

            flexShrink: 0
          }}
        >

          {/* HAMBURGER */}
          <button
            onClick={() =>
              setSidebarOpen(
                (open) => !open
              )
            }

            title={
              sidebarOpen
                ? 'Tutup sidebar'
                : 'Buka sidebar'
            }

            aria-label={
              sidebarOpen
                ? 'Tutup sidebar'
                : 'Buka sidebar'
            }

            style={{
              width: 38,
              height: 38,

              border:
                '1px solid #d7d4cc',

              borderRadius: 8,

              background: '#f4f3ee',

              color: '#303030',

              cursor: 'pointer',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              padding: 0,

              transition:
                'background .15s ease, border-color .15s ease',

              flexShrink: 0
            }}

            onMouseOver={(e) => {
              e.currentTarget.style.background =
                '#ffffff';

              e.currentTarget.style.borderColor =
                '#bdbab2';
            }}

            onMouseOut={(e) => {
              e.currentTarget.style.background =
                '#f4f3ee';

              e.currentTarget.style.borderColor =
                '#d7d4cc';
            }}
          >

            <Menu
              size={23}
              strokeWidth={1.8}
            />

          </button>

        </header>


        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        <div
          style={{
            flex: 1,

            minWidth: 0,
            minHeight: 0,

            overflowY: 'auto',
            overflowX: 'hidden',

            boxSizing: 'border-box'
          }}
        >

          {children}

        </div>

      </main>

    </div>
  );
}