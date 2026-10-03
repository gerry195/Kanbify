import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';

import {
  MoreVertical,
  UserPlus,
  KeyRound,
  BarChart3,
  Trash2,
  X,
  Copy,
  Check,
  Star
} from 'lucide-react';

const CATEGORY_COLORS = {
  Desain: {
    bg: '#fee2e2',
    text: '#b91c1c'
  },

  Pemasaran: {
    bg: '#f3e8ff',
    text: '#7e22ce'
  },

  Pengembangan: {
    bg: '#dbeafe',
    text: '#1d4ed8'
  },

  Umum: {
    bg: '#f1f5f9',
    text: '#475569'
  }
};

function categoryColor(cat) {
  return (
    CATEGORY_COLORS[cat] ||
    CATEGORY_COLORS['Umum']
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';

  const diffMs =
    Date.now() -
    new Date(dateStr).getTime();

  const mins = Math.floor(
    diffMs / 60000
  );

  if (mins < 1) {
    return 'baru saja';
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs = Math.floor(
    mins / 60
  );

  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  const days = Math.floor(
    hrs / 24
  );

  return `${days}d ago`;
}

export default function BoardCard({
  board,
  onOpen,
  onChanged,
  onOpenMembers
}) {
  const isAdmin =
    board.role === 'admin';

  const [starred, setStarred] =
    useState(!!board.starred);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [inviteModalOpen, setInviteModalOpen] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const menuRef =
    useRef(null);

  useEffect(() => {
    setStarred(!!board.starred);
  }, [board.starred]);

  /* =========================================================
     CLOSE MENU WHEN CLICKING OUTSIDE
     ========================================================= */

  useEffect(() => {
    const close = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      close
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        close
      );
    };
  }, []);

  /* =========================================================
     COVER IMAGE
     ========================================================= */

  const coverUrl = board.cover_image
    ? `http://localhost:8000/storage/covers/${board.cover_image}`
    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600';

  /* =========================================================
     TASK PROGRESS
     ========================================================= */

  const total =
    board.total_tasks ?? 0;

  const done =
    board.done_tasks ?? 0;

  const pct =
    total > 0
      ? Math.round(
          (done / total) * 100
        )
      : 0;

  const cat =
    categoryColor(board.category);

  /* =========================================================
     STAR BOARD
     ========================================================= */

  const handleStar = async (e) => {
    e.stopPropagation();

    setStarred((s) => !s);

    try {
      const res =
        await api.toggleStarBoard(
          board.id
        );

      setStarred(res.starred);

      if (onChanged) {
        onChanged();
      }
    } catch {
      setStarred((s) => !s);
    }
  };

  /* =========================================================
     DELETE BOARD
     ========================================================= */

  const handleDelete = async (e) => {
    e.stopPropagation();

    setMenuOpen(false);

    if (
      !window.confirm(
        `Hapus board "${board.name}" beserta seluruh tugas di dalamnya?`
      )
    ) {
      return;
    }

    try {
      await api.deleteBoard(
        board.id
      );

      if (onChanged) {
        onChanged();
      }
    } catch (err) {
      alert(
        err.message ||
          'Gagal menghapus board'
      );
    }
  };

  /* =========================================================
     OPEN INVITE CODE MODAL
     ========================================================= */

  const handleOpenInviteCode = (
    e
  ) => {
    e.stopPropagation();

    setMenuOpen(false);
    setCopied(false);
    setInviteModalOpen(true);
  };

  /* =========================================================
     CLOSE INVITE CODE MODAL
     ========================================================= */

  const handleCloseInviteModal = (
    e
  ) => {
    if (e) {
      e.stopPropagation();
    }

    setInviteModalOpen(false);
    setCopied(false);
  };

  /* =========================================================
     COPY INVITE CODE
     ========================================================= */

  const handleCopyInviteCode =
    async (e) => {
      e.stopPropagation();

      if (!board.invite_code) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          board.invite_code
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1800);
      } catch {
        /*
         * Fallback untuk browser yang
         * tidak mendukung clipboard API.
         */

        try {
          const textarea =
            document.createElement(
              'textarea'
            );

          textarea.value =
            board.invite_code;

          textarea.style.position =
            'fixed';

          textarea.style.opacity = '0';

          document.body.appendChild(
            textarea
          );

          textarea.select();

          document.execCommand(
            'copy'
          );

          document.body.removeChild(
            textarea
          );

          setCopied(true);

          setTimeout(() => {
            setCopied(false);
          }, 1800);
        } catch {
          alert(
            'Kode tidak dapat disalin. Silakan salin secara manual.'
          );
        }
      }
    };

  /* =========================================================
     BOARD CARD
     ========================================================= */

  return (
    <>
      <div
        onClick={() =>
          onOpen &&
          onOpen(
            board.id,
            board.name,
            board.role
          )
        }
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          overflow: 'visible',
          border:
            '1px solid #ece9e1',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          transition:
            'transform .15s, box-shadow .15s',
          boxShadow:
            '0 1px 2px rgba(0,0,0,0.03)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform =
            'translateY(-3px)';

          e.currentTarget.style.boxShadow =
            '0 10px 20px -6px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform =
            'translateY(0)';

          e.currentTarget.style.boxShadow =
            '0 1px 2px rgba(0,0,0,0.03)';
        }}
      >

        {/* =================================================
            HEADER
            ================================================= */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            padding:
              '12px 12px 0 12px'
          }}
        >

          {/* CATEGORY + STAR */}

          <div
            style={{
              display:
                'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: cat.bg,
              color: cat.text,
              fontSize: 10,
              fontWeight: 700,
              padding:
                '4px 10px',
              borderRadius: 999,
              textTransform:
                'uppercase',
              letterSpacing:
                '0.4px'
            }}
          >

            <span
              onClick={handleStar}
              title={
                starred
                  ? 'Hapus dari starred'
                  : 'Tandai sebagai starred'
              }
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                lineHeight: 1,
                color: starred
                  ? '#f59e0b'
                  : cat.text,
                opacity:
                  starred ? 1 : 0.55
              }}
            >
              <Star
                size={11}
                strokeWidth={2}
                fill={
                  starred
                    ? 'currentColor'
                    : 'none'
                }
              />
            </span>

            {board.category ||
              'Umum'}

          </div>

          {/* MENU */}

          <div
            ref={menuRef}
            style={{
              position: 'relative'
            }}
          >

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                setMenuOpen(
                  (o) => !o
                );
              }}
              style={{
                background:
                  'rgba(0,0,0,0.04)',
                border: 'none',
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                padding: 0
              }}
              title="Menu board"
            >
              <MoreVertical
                size={16}
                strokeWidth={1.9}
              />
            </button>

            {/* DROPDOWN */}

            {menuOpen && (
              <div
                onClick={(e) =>
                  e.stopPropagation()
                }
                style={{
                  position:
                    'absolute',
                  top: 33,
                  right: 0,
                  background:
                    '#ffffff',
                  border:
                    '1px solid #eee',
                  borderRadius: 10,
                  width: 190,
                  boxShadow:
                    '0 8px 20px rgba(0,0,0,0.12)',
                  zIndex: 50,
                  overflow: 'hidden',
                  padding:
                    '4px 0'
                }}
              >

                {/* INVITE MEMBER */}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);

                    if (
                      onOpenMembers
                    ) {
                      onOpenMembers(
                        board
                      );
                    }
                  }}
                  style={menuBtnStyle}
                >
                  <UserPlus
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>
                    Undang Anggota
                  </span>
                </button>

                {/* INVITE CODE
                    ONLY ADMIN */}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={
                      handleOpenInviteCode
                    }
                    style={
                      menuBtnStyle
                    }
                  >
                    <KeyRound
                      size={15}
                      strokeWidth={1.8}
                    />

                    <span>
                      Kode Undangan
                    </span>
                  </button>
                )}

                {/* STATISTICS */}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(
                      false
                    );

                    if (onOpen) {
                      onOpen(
                        board.id,
                        board.name,
                        board.role
                      );
                    }
                  }}
                  style={
                    menuBtnStyle
                  }
                >
                  <BarChart3
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>
                    Statistik Board
                  </span>
                </button>

                {/* DELETE */}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={
                      handleDelete
                    }
                    style={{
                      ...menuBtnStyle,
                      color: '#dc2626',
                      borderBottom:
                        'none'
                    }}
                  >
                    <Trash2
                      size={15}
                      strokeWidth={1.8}
                    />

                    <span>
                      Hapus Board
                    </span>
                  </button>
                )}

              </div>
            )}

          </div>

        </div>

        {/* =================================================
            COVER
            ================================================= */}

        <div
          style={{
            width: '100%',
            height: 130,
            marginTop: 10,
            backgroundColor:
              '#e2e8f0',
            overflow: 'hidden'
          }}
        >
          <img
            src={coverUrl}
            alt={board.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* =================================================
            BOARD INFO
            ================================================= */}

        <div
          style={{
            padding:
              '14px 16px 16px 16px'
          }}
        >

          <h3
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: '#1e1e1e',
              margin:
                '0 0 10px 0'
            }}
          >
            {board.name}
          </h3>

          {/* PROGRESS */}

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              fontSize: 11,
              color: '#8a8a86',
              marginBottom: 5
            }}
          >
            <span>
              Progres Tugas
            </span>

            <span
              style={{
                fontWeight: 600,
                color: '#4b4b47'
              }}
            >
              {done}/{total}
            </span>
          </div>

          <div
            style={{
              height: 5,
              borderRadius: 4,
              background:
                '#f0efe9',
              overflow: 'hidden',
              marginBottom: 12
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background:
                  pct === 100
                    ? '#16a34a'
                    : '#f97316',
                transition:
                  'width .25s ease'
              }}
            />
          </div>

          {/* MEMBERS + UPDATED */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between'
            }}
          >

            <div
              style={{
                display: 'flex'
              }}
            >

              {(board.members || [])
                .slice(0, 4)
                .map((m, i) => (
                  <div
                    key={m.id}
                    title={
                      m.fullname ||
                      m.username
                    }
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius:
                        '50%',
                      overflow: 'hidden',
                      border:
                        '2px solid #fff',
                      marginLeft:
                        i === 0
                          ? 0
                          : -8,
                      background:
                        '#f97316',
                      color:
                        '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center'
                    }}
                  >
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt=""
                        style={{
                          width:
                            '100%',
                          height:
                            '100%',
                          objectFit:
                            'cover'
                        }}
                      />
                    ) : (
                      (
                        m.fullname ||
                        m.username
                      )?.[0]?.toUpperCase()
                    )}
                  </div>
                ))}

            </div>

            <span
              style={{
                fontSize: 10.5,
                color: '#a8a8a3',
                display: 'flex',
                alignItems:
                  'center',
                gap: 4
              }}
            >
              Updated&nbsp;
              {timeAgo(
                board.updated_at ||
                  board.created_at
              )}
            </span>

          </div>

        </div>

      </div>

      {/* ===================================================
          INVITE CODE MODAL
          =================================================== */}

      {inviteModalOpen && (
        <div
          onClick={
            handleCloseInviteModal
          }
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(15,15,15,0.42)',
            backdropFilter:
              'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            padding: 20,
            zIndex: 1000,
            boxSizing:
              'border-box'
          }}
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: 400,
              maxWidth: '100%',
              background:
                '#ffffff',
              borderRadius: 18,
              padding: 25,
              boxSizing:
                'border-box',
              boxShadow:
                '0 24px 60px rgba(0,0,0,0.18)'
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                display: 'flex',
                alignItems:
                  'flex-start',
                justifyContent:
                  'space-between',
                gap: 15,
                marginBottom: 20
              }}
            >

              <div>

                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background:
                      '#fff1e7',
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    marginBottom: 12
                  }}
                >
                  <KeyRound
                    size={19}
                    color="#ff6b0b"
                    strokeWidth={1.9}
                  />
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#171717'
                  }}
                >
                  Kode Undangan
                </h2>

                <p
                  style={{
                    margin:
                      '5px 0 0',
                    fontSize: 12,
                    color: '#99958e',
                    lineHeight:
                      1.5
                  }}
                >
                  Bagikan kode ini kepada
                  anggota yang ingin
                  bergabung ke board.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseInviteModal
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background:
                    '#f5f4f1',
                  color: '#77736c',
                  cursor:
                    'pointer',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  padding: 0,
                  flexShrink: 0
                }}
                title="Tutup"
              >
                <X
                  size={17}
                  strokeWidth={1.8}
                />
              </button>

            </div>

            {/* BOARD NAME */}

            <div
              style={{
                fontSize: 11.5,
                color: '#99958e',
                marginBottom: 8
              }}
            >
              Board
            </div>

            <div
              style={{
                fontSize: 13.5,
                fontWeight: 650,
                color: '#292929',
                marginBottom: 16
              }}
            >
              {board.name}
            </div>

            {/* INVITE CODE */}

            <div
              style={{
                background:
                  '#faf9f6',
                border:
                  '1px solid #e7e3db',
                borderRadius: 12,
                padding:
                  '18px 14px',
                textAlign: 'center',
                marginBottom: 13
              }}
            >

              <div
                style={{
                  fontSize: 10.5,
                  color: '#99958e',
                  marginBottom: 9,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.8px',
                  fontWeight: 650
                }}
              >
                Invite Code
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 750,
                  letterSpacing:
                    '3px',
                  color: '#151515',
                  lineHeight: 1.2,
                  wordBreak:
                    'break-all'
                }}
              >
                {board.invite_code ||
                  'Kode tidak tersedia'}
              </div>

            </div>

            {/* INFO */}

            <div
              style={{
                fontSize: 11.5,
                color: '#8a867f',
                lineHeight: 1.5,
                marginBottom: 18
              }}
            >
              Orang yang memiliki kode
              ini dapat menggunakannya
              melalui tombol{' '}
              <strong
                style={{
                  color: '#66615a'
                }}
              >
                Gabung Board
              </strong>{' '}
              di Dashboard.
            </div>

            {/* BUTTONS */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: 10
              }}
            >

              <button
                type="button"
                onClick={
                  handleCloseInviteModal
                }
                style={{
                  padding:
                    '10px 16px',
                  borderRadius: 9,
                  border:
                    '1px solid #e3dfd7',
                  background:
                    '#ffffff',
                  color: '#55524c',
                  cursor:
                    'pointer',
                  fontSize: 12.5,
                  fontWeight: 500
                }}
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={
                  handleCopyInviteCode
                }
                disabled={
                  !board.invite_code
                }
                style={{
                  padding:
                    '10px 16px',
                  borderRadius: 9,
                  border: 'none',
                  background:
                    copied
                      ? '#16a34a'
                      : '#ff6b0b',
                  color:
                    '#ffffff',
                  cursor:
                    board.invite_code
                      ? 'pointer'
                      : 'default',
                  fontSize: 12.5,
                  fontWeight: 650,
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap: 7,
                  opacity:
                    board.invite_code
                      ? 1
                      : 0.6,
                  transition:
                    'background .15s ease'
                }}
              >

                {copied ? (
                  <>
                    <Check
                      size={15}
                      strokeWidth={2}
                    />

                    Kode Disalin
                  </>
                ) : (
                  <>
                    <Copy
                      size={15}
                      strokeWidth={1.9}
                    />

                    Salin Kode
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </>
  );
}

/* =========================================================
   MENU BUTTON STYLE
   ========================================================= */

const menuBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  textAlign: 'left',
  padding: '10px 14px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 12.5,
  color: '#333',
  borderBottom:
    '1px solid #f4f4f4'
};