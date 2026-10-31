import React, { useState } from 'react';

import {
  AuthProvider,
  useAuth
} from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import SocialCallbackPage from './pages/SocialCallbackPage';
import DashboardPage from './pages/DashboardPage';
import AllBoardsPage from './pages/AllBoardsPage';
import ProfilePage from './pages/ProfilePage';
import StatsPage from './pages/StatsPage';
import KanbanBoardPage from './App-Kanban';
import Layout from './components/Layout';
import { ToastViewport } from './components/Toast';
import SplashScreen from './components/SplashScreen';

import {
  Construction,
  Users
} from 'lucide-react';

// Splash penuh hanya sekali per sesi; muat ulang berikutnya cukup logo singkat.
const SPLASH_KEY = 'kanbify_splash_seen';

function splashSeen() {
  try {
    return sessionStorage.getItem(SPLASH_KEY) === '1';
  } catch {
    return false;
  }
}

function AppContent() {
  const {
    isAuthenticated,
    loading: authLoading
  } = useAuth();

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [statsBoardId, setStatsBoardId] = useState(null);

  const [selectedBoardId, setSelectedBoardId] = useState(null);

  const [selectedBoardName, setSelectedBoardName] = useState('');

  const [selectedBoardRole, setSelectedBoardRole] = useState('member');

  const [showLoading, setShowLoading] = useState(true);
  const [quickSplash] = useState(splashSeen);

  /*
  |--------------------------------------------------------------------------
  | SPLASH
  |--------------------------------------------------------------------------
  */

  if (showLoading) {
    return (
      <SplashScreen
        quick={quickSplash}
        ready={!authLoading}
        onDone={() => {
          try {
            sessionStorage.setItem(SPLASH_KEY, '1');
          } catch {
            /* sessionStorage tidak tersedia, abaikan */
          }
          setShowLoading(false);
        }}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  // Google mengembalikan pengguna ke /auth/callback?code=...
  if (window.location.pathname === '/auth/callback') {
    return <SocialCallbackPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  /*
  |--------------------------------------------------------------------------
  | SELECT BOARD
  |--------------------------------------------------------------------------
  */

  const handleSelectBoard = (
    boardId,
    boardName,
    role
  ) => {
    setSelectedBoardId(boardId);
    setSelectedBoardName(boardName);
    setSelectedBoardRole(role || 'member');
    setCurrentPage('board');
  };

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleOpenStats = (boardId) => {
    setStatsBoardId(boardId);
    setCurrentPage('stats');
  };

  const handleNavigate = (page) => {
    setStatsBoardId(null);

    /*
     * Kalau pindah dari board ke halaman lain,
     * board yang sedang dipilih dibersihkan.
     */
    if (page !== 'board') {
      setSelectedBoardId(null);
      setSelectedBoardName('');
      setSelectedBoardRole('member');
    }

    setCurrentPage(page);
  };

  /*
  |--------------------------------------------------------------------------
  | MAIN APP
  |--------------------------------------------------------------------------
  */

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
    >
      {/* =====================================================
          BOARD
      ====================================================== */}

      {currentPage === 'board' && (
        <KanbanBoardPage
          boardId={selectedBoardId}
          boardName={selectedBoardName}
          role={selectedBoardRole}
          onBackToDashboard={() => {
            setSelectedBoardId(null);
            setSelectedBoardName('');
            setSelectedBoardRole('member');
            setCurrentPage('dashboard');
          }}
        />
      )}

      {/* =====================================================
          DASHBOARD
      ====================================================== */}

      {currentPage === 'dashboard' && (
        <DashboardPage
          onSelectBoard={handleSelectBoard}
          onNavigate={handleNavigate}
          onOpenStats={handleOpenStats}
        />
      )}

      {/* =====================================================
          ALL BOARDS
      ====================================================== */}

      {currentPage === 'allboards' && (
        <AllBoardsPage
          onSelectBoard={handleSelectBoard}
          onOpenStats={handleOpenStats}
        />
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      {currentPage === 'stats' && (
        <StatsPage
          initialBoardId={statsBoardId}
          onOpenBoard={handleSelectBoard}
        />
      )}

      {/* =====================================================
          MEMBERS
      ====================================================== */}

      {currentPage === 'members' && (
        <div
          className="k-frost"
          style={{
            maxWidth: 560,
            margin: '48px auto',
            padding: 48,
            textAlign: 'center',
            color: 'var(--k-ink-2)',
            fontFamily: 'var(--k-font-body)'
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#fdf1e7',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Construction
              size={25}
              strokeWidth={1.8}
              color="#f97316"
            />
          </div>

          <p style={{ fontSize: 14 }}>
            Kelola anggota tim per-board lewat tombol{' '}
            <strong
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Users
                size={15}
                strokeWidth={2}
              />
              Members
            </strong>{' '}
            di dalam halaman board.
            <br />
            Halaman anggota tim global akan segera hadir.
          </p>
        </div>
      )}

      {/* =====================================================
          PROFILE
      ====================================================== */}

      {currentPage === 'profile' && (
        <ProfilePage />
      )}
    </Layout>
  );
}

/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastViewport />
    </AuthProvider>
  );
}