const API_URL = import.meta.env.VITE_API_URL;

export async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function signup(email, username, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Signup failed');
  }
  return data;
}

export async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
}

export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/auth/current`, {
    method: 'GET',
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to get user');
  }
  return data;
}