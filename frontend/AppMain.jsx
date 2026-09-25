import React, {
  useState,
  useEffect,
  useRef
} from 'react';

import anime from 'animejs';

import {
  AuthProvider,
  useAuth
} from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AllBoardsPage from './pages/AllBoardsPage';
import ProfilePage from './pages/ProfilePage';
import StatsPage from './pages/StatsPage';
import SchedulePage from './pages/schedulepage.jsx';
import KanbanBoardPage from './App-Kanban';
import Layout from './components/Layout';
import loadingBg from './assets/kanbifyloading.jpg';

import {
  Construction,
  Users
} from 'lucide-react';

const INSPIRATIONAL_QUOTES = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    language: "English"
  },
  {
    text: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon",
    language: "English"
  },
  {
    text: "সাফল্যের চাবিকাঠি হলো নিজের ওপর বিশ্বাস রাখা।",
    author: "Muhammad Yunus",
    language: "Bengali"
  },
  {
    text: "Il n'y a que ceux qui risquent rien qui ne risquent rien.",
    author: "François Mitterrand",
    language: "Français"
  },
  {
    text: "成功的秘诀就是每天都比昨天进步一点点。",
    author: "Jack Ma",
    language: "中文"
  },
  {
    text: "गलतियों से सीखना ही सफलता की कुंजी है।",
    author: "Dr. A.P.J. Abdul Kalam",
    language: "हिंदी"
  },
  {
    text: "Phantasie ist wichtiger als Wissen.",
    author: "Albert Einstein",
    language: "Deutsch"
  },
  {
    text: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
    language: "English"
  },
  {
    text: "The only way to do great work is to just start.",
    author: "Mark Zuckerberg",
    language: "English"
  },
  {
    text: "Visionen är inte bara en framtidsdröm, det är nästa steg.",
    author: "Ingvar Kamprad",
    language: "Svenska"
  }
];

function AppContent() {
  const {
    isAuthenticated,
    loading: authLoading
  } = useAuth();

  const [currentPage, setCurrentPage] = useState('dashboard');

  const [selectedBoardId, setSelectedBoardId] = useState(null);

  const [selectedBoardName, setSelectedBoardName] = useState('');

  const [selectedBoardRole, setSelectedBoardRole] = useState('member');

  const [showLoading, setShowLoading] = useState(true);

  const [randomQuote] = useState(() =>
    INSPIRATIONAL_QUOTES[
      Math.floor(
        Math.random() * INSPIRATIONAL_QUOTES.length
      )
    ]
  );

  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const textRef = useRef(null);
  const quoteRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | LOADING ANIMATION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const tl = anime.timeline({
      easing: 'easeOutExpo'
    });

    tl.add(
      {
        targets: logoRef.current,
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 1200
      },
      0
    )
      .add(
        {
          targets: textRef.current,
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 700
        },
        400
      )
      .add(
        {
          targets: quoteRef.current,
          opacity: [0, 1],
          translateY: [-5, 0],
          duration: 600
        },
        800
      )
      .add(
        {
          targets: containerRef.current,
          opacity: 0,
          duration: 600,
          delay: 800,
          easing: 'easeInOutQuad'
        }
      )
      .finished
      .then(() => {
        setShowLoading(false);
      });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOADING SCREEN
  |--------------------------------------------------------------------------
  */

  if (showLoading || authLoading) {
    return (
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          height: '100vh',
          backgroundImage: `url(${loadingBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 9999,
          padding: '40px',
          boxSizing: 'border-box'
        }}
      >
        <div
          ref={logoRef}
          style={{
            width: '320px',
            maxWidth: '85%',
            opacity: 0,
            filter:
              'drop-shadow(0 10px 30px rgba(255,255,255,0.1))',
            marginBottom: '32px'
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 260 60"
            width="260"
            height="60"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          >
            <defs>
              <style>{`
                .trail1 {
                  animation:
                    slideIn
                    0.4s
                    cubic-bezier(0.22,1,0.36,1)
                    0.08s
                    both;
                }

                .trail2 {
                  animation:
                    slideIn
                    0.38s
                    cubic-bezier(0.22,1,0.36,1)
                    0.16s
                    both;
                }

                .trail3 {
                  animation:
                    slideIn
                    0.36s
                    cubic-bezier(0.22,1,0.36,1)
                    0.24s
                    both;
                }

                .card {
                  animation:
                    slideIn
                    0.34s
                    cubic-bezier(0.22,1,0.36,1)
                    0.34s
                    both;
                }

                .line1 {
                  animation:
                    scaleIn
                    0.26s
                    cubic-bezier(0.22,1,0.36,1)
                    0.46s
                    both;
                  transform-origin: 16px 13px;
                }

                .line2 {
                  animation:
                    scaleIn
                    0.24s
                    cubic-bezier(0.22,1,0.36,1)
                    0.51s
                    both;
                  transform-origin: 16px 21px;
                }

                .line3 {
                  animation:
                    scaleIn
                    0.22s
                    cubic-bezier(0.22,1,0.36,1)
                    0.56s
                    both;
                  transform-origin: 16px 29px;
                }

                .wmark {
                  animation:
                    fadeSlide
                    0.35s
                    cubic-bezier(0.22,1,0.36,1)
                    0.7s
                    both;
                }

                .tag {
                  animation:
                    fadeSlide
                    0.3s
                    cubic-bezier(0.22,1,0.36,1)
                    0.8s
                    both;
                }

                @keyframes slideIn {
                  from {
                    opacity: 0;
                    transform: translateY(8px);
                  }

                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }

                @keyframes scaleIn {
                  from {
                    opacity: 0;
                    transform: scaleX(0);
                  }

                  to {
                    opacity: 1;
                    transform: scaleX(1);
                  }
                }

                @keyframes fadeSlide {
                  from {
                    opacity: 0;
                    transform: translateX(-8px);
                  }

                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
              `}</style>
            </defs>

            <g className="trail1">
              <rect
                x="8"
                y="26"
                width="50"
                height="34"
                rx="5"
                fill="#ffffff"
                opacity="0.15"
                transform="rotate(-10 33 43)"
              />
            </g>

            <g className="trail2">
              <rect
                x="8"
                y="20"
                width="50"
                height="34"
                rx="5"
                fill="#ffffff"
                opacity="0.32"
                transform="rotate(-5 33 37)"
              />
            </g>

            <g className="trail3">
              <rect
                x="8"
                y="12"
                width="50"
                height="34"
                rx="5"
                fill="#ffffff"
                opacity="0.55"
                transform="rotate(-2 33 29)"
              />
            </g>

            <g className="card">
              <rect
                x="8"
                y="4"
                width="50"
                height="34"
                rx="5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
            </g>

            <rect
              className="line1"
              x="16"
              y="13"
              width="26"
              height="3"
              rx="1.5"
              fill="#d1d5db"
              opacity="0.9"
            />

            <rect
              className="line2"
              x="16"
              y="21"
              width="18"
              height="3"
              rx="1.5"
              fill="#d1d5db"
              opacity="0.55"
            />

            <rect
              className="line3"
              x="16"
              y="29"
              width="22"
              height="3"
              rx="1.5"
              fill="#d1d5db"
              opacity="0.3"
            />

            <text
              className="wmark"
              x="82"
              y="38"
              fontFamily="system-ui, sans-serif"
              fontSize="32"
              fontWeight="600"
              fill="#ffffff"
              letterSpacing="-0.5"
            >
              Kanbify
            </text>

            <text
              className="tag"
              x="84"
              y="52"
              fontFamily="system-ui, sans-serif"
              fontSize="8"
              fontWeight="500"
              fill="#f3f4f6"
              letterSpacing="2"
            >
              MOVE. TRACK. DONE.
            </text>
          </svg>
        </div>

        <p
          ref={textRef}
          style={{
            opacity: 0,
            fontSize: 14,
            margin: '0 0 80px 0',
            fontWeight: 400,
            letterSpacing: '0.5px',
            color: '#e0e0e0'
          }}
        >
          Welcome...
        </p>

        <div
          ref={quoteRef}
          style={{
            maxWidth: '600px',
            width: '100%',
            opacity: 0,
            textAlign: 'center',
            padding: '0 20px',
            position: 'absolute',
            bottom: '48px'
          }}
        >
          <p
            style={{
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: 1.6,
              margin: '0 0 12px 0',
              opacity: 0.85,
              fontStyle: 'italic',
              color: '#ffffff'
            }}
          >
            "{randomQuote.text}"
          </p>

          <p
            style={{
              fontSize: '14px',
              fontWeight: 400,
              margin: 0,
              opacity: 0.85,
              letterSpacing: '0.5px',
              color: '#ffffff'
            }}
          >
            — {randomQuote.author} ({randomQuote.language})
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

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

  const handleNavigate = (page) => {
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
          onNavigate={setCurrentPage}
        />
      )}

      {/* =====================================================
          ALL BOARDS
      ====================================================== */}

      {currentPage === 'allboards' && (
        <AllBoardsPage
          onSelectBoard={handleSelectBoard}
        />
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      {currentPage === 'stats' && (
        <StatsPage />
      )}

      {/* =====================================================
          SCHEDULE
      ====================================================== */}

      {currentPage === 'schedule' && ( 
        <SchedulePage />
      )}

      {/* =====================================================
          MEMBERS
      ====================================================== */}

      {currentPage === 'members' && (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: '#8a8a86',
            fontFamily: 'system-ui'
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
    </AuthProvider>
  );
}