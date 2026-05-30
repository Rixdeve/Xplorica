/**
 * Xplorica LK — API Service
 * All HTTP calls to the Spring Boot backend (proxied through Vite in dev).
 */

// ── Token helpers ─────────────────────────────────────────────────────────
export const getToken   = ()  => localStorage.getItem("xplorica_token");
export const setToken   = (t) => localStorage.setItem("xplorica_token", t);
export const clearToken = ()  => localStorage.removeItem("xplorica_token");

// ── User session helpers ──────────────────────────────────────────────────
export const saveUser = (user) => localStorage.setItem("xplorica_user", JSON.stringify(user));
export const loadUser = () => {
  try { return JSON.parse(localStorage.getItem("xplorica_user")); } catch { return null; }
};
export const clearUser = () => localStorage.removeItem("xplorica_user");

// API base URL - empty for development (uses Vite proxy), can be set via env var for production
const API_URL = import.meta.env.VITE_API_URL || 'https://xplorica-production.up.railway.app';

// ── HTTP helpers ──────────────────────────────────────────────────────────
const jsonHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const bearerHeaders = () => ({
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const handleResponse = async (res) => {
  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try {
      const body = await res.json();
      msg = body.message || body.error || msg;
    } catch { /* empty body — keep default */ }
    throw new Error(msg);
  }
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
};

// ── Auth ──────────────────────────────────────────────────────────────────
export const register = (data) =>
  fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const login = (data) =>
  fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

// ── Guides ────────────────────────────────────────────────────────────────
export const listGuides = ({ language, destination, minRating } = {}) => {
  const params = new URLSearchParams();
  if (language)    params.append("language",    language);
  if (destination) params.append("destination", destination);
  if (minRating)   params.append("minRating",   minRating);
  const qs = params.toString();
  return fetch(`${API_URL}/api/guides${qs ? `?${qs}` : ""}`, {
    headers: bearerHeaders(),
  }).then(handleResponse);
};

export const getGuide = (id) =>
  fetch(`${API_URL}/api/guides/${id}`, { headers: bearerHeaders() }).then(handleResponse);

export const upsertGuideProfile = (data) =>
  fetch(`${API_URL}/api/guides/profile`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const uploadGuidePhoto = (file) => {
  const fd = new FormData();
  fd.append("photo", file);
  return fetch(`${API_URL}/api/guides/profile/photo`, {
    method: "POST",
    headers: bearerHeaders(),
    body: fd,
  }).then(handleResponse);
};

export const rateGuide = (guideId, data) =>
  fetch(`${API_URL}/api/guides/${guideId}/rate`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const getGuideRatings = (guideId) =>
  fetch(`${API_URL}/api/guides/${guideId}/ratings`, { headers: bearerHeaders() }).then(handleResponse);

export const getLatestReviews = () =>
  fetch(`${API_URL}/api/guides/reviews`, { headers: bearerHeaders() }).then(handleResponse);

// ── Chat ──────────────────────────────────────────────────────────────────
export const sendMessage = (receiverId, content) =>
  fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ receiverId, content }),
  }).then(handleResponse);

export const getConversation = (partnerId) =>
  fetch(`${API_URL}/api/chat/${partnerId}`, { headers: bearerHeaders() }).then(handleResponse);

export const getChatPartners = () =>
  fetch(`${API_URL}/api/chat/partners`, { headers: bearerHeaders() }).then(handleResponse);

// ── Bookings ──────────────────────────────────────────────────────────────
export const createBooking = (data) =>
  fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const getMyBookings = () =>
  fetch(`${API_URL}/api/bookings/mine`, { headers: bearerHeaders() }).then(handleResponse);

export const confirmPayment = (bookingId) =>
  fetch(`${API_URL}/api/bookings/${bookingId}/pay`, {
    method: "POST",
    headers: bearerHeaders(),
  }).then(handleResponse);

export const updateBookingStatus = (bookingId, status) =>
  fetch(`${API_URL}/api/bookings/${bookingId}/status?status=${status}`, {
    method: "PATCH",
    headers: bearerHeaders(),
  }).then(handleResponse);

// ── Premium ───────────────────────────────────────────────────────────────
export const subscribePremium = () =>
  fetch(`${API_URL}/api/guides/subscribe`, {
    method: "POST",
    headers: bearerHeaders(),
  }).then(handleResponse);

export const getGuideAnalytics = () =>
  fetch(`${API_URL}/api/guides/analytics`, { headers: bearerHeaders() }).then(handleResponse);
