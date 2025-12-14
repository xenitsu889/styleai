// Simple API client for the StylieAI backend
import { getSavedIdToken, getSavedUid } from './auth';

type ChatResponse = {
  reply: string;
  explain?: string;
  tags?: string[];
  image_prompt?: string;
};

// Resolve API base URL from environment. Prefer NEXT_PUBLIC_API_BASE, then VITE_API_BASE.
// Default to local dev API at http://localhost:5000.
const API_BASE: string =
  (typeof process !== 'undefined' && (process as any)?.env?.NEXT_PUBLIC_API_BASE) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_BASE) ||
  'http://localhost:5000';

export function ensureUserId(): string {
  try {
    // New policy: if a Firebase UID is available, it is the canonical id.
    const authed = getSavedUid?.();
    if (authed) {
      localStorage.setItem('stylie_user_id', authed);
      return authed;
    }
    // Otherwise fall back to previously stored local id (anonymous session)
    const existing = localStorage.getItem('stylie_user_id');
    if (existing) return existing;
    // Or generate a local id for anonymous usage
    const id = `user_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('stylie_user_id', id);
    return id;
  } catch {
    return 'user_local';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getSavedIdToken();
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json'
  };
  
  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Merge with any additional headers from options
  if (options?.headers) {
    const optHeaders = options.headers as Record<string, string>;
    Object.assign(headers, optHeaders);
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

// Chat
export async function sendChat(userId: string, message: string | undefined, options?: { mode?: string; chatId?: string }): Promise<any> {
  // Include optional metadata (like mode or chatId) so the backend can store chat type and append to sessions.
  const body: any = { userId };
  if (typeof message !== 'undefined') body.message = message;
  if (options?.mode) body.mode = options.mode;
  if (options?.chatId) body.chatId = options.chatId;
  return request<any>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Create an empty chat session and return its chatId
export async function createChat(userId: string, options?: { mode?: string }): Promise<{ chatId: string }> {
  const body: any = { userId };
  if (options?.mode) body.mode = options.mode;
  return request<{ chatId: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchChatHistory(userId: string) {
  return request<{ chats: any[] }>(`/api/chat/${encodeURIComponent(userId)}`);
}

// Delete a specific chat document for a user
export async function deleteChat(userId: string, chatId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/chat/${encodeURIComponent(userId)}/${encodeURIComponent(chatId)}`, {
    method: 'DELETE',
  });
}

// Image
export async function generateOutfitImage(userId: string, prompt: string): Promise<{ url: string }> {
  return request<{ url: string }>(`/api/image`, {
    method: 'POST',
    body: JSON.stringify({ userId, prompt }),
  });
}

// Profile
export async function saveProfile(profile: any) {
  return request(`/api/profile`, {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export type UserProfileResponse = {
  userId?: string;
  name?: string;
  age?: string | number;
  gender?: string;
  heightRange?: string;
  bodyType?: string;
  skinTone?: string;
  favouriteColours?: string[];
  region?: string;
  languagePref?: string;
  imageUrl?: string;
  error?: string;
};

export async function getProfile(userId: string): Promise<UserProfileResponse> {
  try {
    const primary = await request<UserProfileResponse>(`/api/profile/${encodeURIComponent(userId)}`);
    // If the server explicitly returns not found, attempt fallback to Firebase UID
    if (primary && (primary as any).error) {
      const alt = getSavedUid?.();
      if (alt && alt !== userId) {
        try {
          const secondary = await request<UserProfileResponse>(`/api/profile/${encodeURIComponent(alt)}`);
          return secondary;
        } catch {
          // ignore and return primary
        }
      }
    }
    return primary;
  } catch (err) {
    // On network or 404-like error try fallback id if available
    const alt = getSavedUid?.();
    if (alt && alt !== userId) {
      try {
        return await request<UserProfileResponse>(`/api/profile/${encodeURIComponent(alt)}`);
      } catch {
        // fall through
      }
    }
    throw err;
  }
}

// Wardrobe
export async function addWardrobeItem(userId: string, item: { name: string; category: string; imageUrl?: string }) {
  return request(`/api/wardrobe`, {
    method: 'POST',
    body: JSON.stringify({ userId, item }),
  });
}

export type WardrobeResponse = {
  items: Array<{
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
  }>;
};

export async function getWardrobe(userId: string): Promise<WardrobeResponse> {
  try {
    const primary = await request<WardrobeResponse>(`/api/wardrobe/${encodeURIComponent(userId)}`);
    // If empty, try fallback Firebase UID
    if ((!primary || (Array.isArray(primary.items) && primary.items.length === 0))) {
      const alt = getSavedUid?.();
      if (alt && alt !== userId) {
        try {
          const secondary = await request<WardrobeResponse>(`/api/wardrobe/${encodeURIComponent(alt)}`);
          return secondary;
        } catch {
          // ignore and return primary
        }
      }
    }
    return primary;
  } catch (err) {
    const alt = getSavedUid?.();
    if (alt && alt !== userId) {
      try {
        return await request<WardrobeResponse>(`/api/wardrobe/${encodeURIComponent(alt)}`);
      } catch {
        // fall through
      }
    }
    throw err;
  }
}

// Link a legacy local user id into the currently authenticated Firebase UID.
export async function linkAccount(oldUserId: string, deleteOld?: boolean) {
  return request('/api/account/link', {
    method: 'POST',
    body: JSON.stringify({ oldUserId, deleteOld: !!deleteOld }),
  });
}

export async function deleteWardrobeItem(userId: string, itemId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/wardrobe/${encodeURIComponent(userId)}/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}

// Uploads
export async function uploadProfilePhoto(userId: string, imageBase64: string) {
  return request(`/api/upload/profile-photo`, {
    method: 'POST',
    body: JSON.stringify({ userId, imageBase64 }),
  });
}

export async function uploadWardrobeImage(userId: string, imageBase64: string) {
  return request<{ success: boolean; url: string }>(`/api/upload/wardrobe-item`, {
    method: 'POST',
    body: JSON.stringify({ userId, imageBase64 }),
  });
}


