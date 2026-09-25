const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getHeaders(isFormData = false) {
    return {
      Accept: 'application/json',
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(this.token && { Authorization: `Bearer ${this.token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const isFormData = options.body instanceof FormData;

    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(isFormData)
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Server error ${response.status}: endpoint tidak ditemukan`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'API Error');
    }
    return data;
  }

  // ── AUTH ──────────────────────────────────────────────
  async register(username, email, password, fullname) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullname })
    });
  }

  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // ── PROFILE ───────────────────────────────────────────
  async updateProfile(fullname, avatar) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullname, avatar })
    });
  }

  async deleteAccount() {
    return this.request('/user/profile', { method: 'DELETE' });
  }

  // ── BOARDS ────────────────────────────────────────────
  async getBoards() {
    return this.request('/boards');
  }

  async createBoard(formData) {
    return this.request('/boards', { method: 'POST', body: formData });
  }

  async getBoard(id) {
    return this.request(`/boards/${id}`);
  }

  async deleteBoard(boardId) {
    return this.request(`/boards/${boardId}`, { method: 'DELETE' });
  }

  async toggleStarBoard(boardId) {
    return this.request(`/boards/${boardId}/star`, { method: 'PUT' });
  }

  // ── BOARD MEMBERS (roles) ─────────────────────────────
  async getBoardMembers(boardId) {
    return this.request(`/boards/${boardId}/members`);
  }

  async addBoardMember(boardId, username, role = 'member') {
    return this.request(`/boards/${boardId}/members`, {
      method: 'POST',
      body: JSON.stringify({ username, role })
    });
  }

  async updateBoardMemberRole(boardId, userId, role) {
    return this.request(`/boards/${boardId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  async removeBoardMember(boardId, userId) {
    return this.request(`/boards/${boardId}/members/${userId}`, { method: 'DELETE' });
  }

  // ── TASKS ─────────────────────────────────────────────
  async getTasks(boardId) {
    return this.request(`/boards/${boardId}/tasks`);
  }

  async createTask(title, description, status, color, board_id, due_date, time = 0, is_running = false, priority = 'sedang') {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: description || '',
        status,
        priority,
        color,
        board_id,
        due_date,
        time: parseInt(time) || 0,
        is_running: !!is_running
      })
    });
  }

  async updateTask(id, title, description, status, color, time, isRunning, due_date, priority) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        color,
        time,
        isRunning: !!isRunning,
        due_date
      })
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  // ── STATS ─────────────────────────────────────────────
  async getStats() {
    return this.request('/stats');
  }

  async getBoardStats(boardId) {
    return this.request(`/boards/${boardId}/stats`);
  }
}

export const api = new APIClient();
