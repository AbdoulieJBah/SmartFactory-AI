export const TOKEN_KEY = "smartfactory_token";
export const USER_KEY = "smartfactory_user";

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;

  window.location.href = "/login";
}

export function isAuthenticated() {
  return !!getToken();
}