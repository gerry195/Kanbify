import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('authToken');
      const savedUser  = localStorage.getItem('authUser');

      // ✅ FIX: Validasi sebelum JSON.parse
      // "undefined", "null", atau string kosong langsung skip
      if (savedToken && savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        const parsedUser = JSON.parse(savedUser);
        // Pastikan hasil parse adalah object valid, bukan null
        if (parsedUser && typeof parsedUser === 'object') {
          setToken(savedToken);
          setUser(parsedUser);
        } else {
          // Data tidak valid, bersihkan localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        }
      } else {
        // Bersihkan sisa data lama yang tidak valid
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    } catch (e) {
      // JSON.parse gagal — bersihkan semua dan mulai fresh
      console.warn('AuthContext: localStorage corrupt, clearing...', e);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('kanban_quests');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}