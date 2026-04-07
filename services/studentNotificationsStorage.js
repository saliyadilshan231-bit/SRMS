/**
 * In-app notifications for students (AsyncStorage, same device as session polls).
 * When a tutor publishes a session poll, a row is stored here for the student dashboard.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storageKeys';

const MAX_ITEMS = 40;

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeList(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveList(list) {
  await AsyncStorage.setItem(STORAGE_KEYS.studentNotifications, JSON.stringify(list));
}

export async function getStudentNotifications() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.studentNotifications);
  return normalizeList(raw);
}

/**
 * @param {{ pollId: string, moduleId: string, moduleTitle: string, pollTitle: string }} data
 */
export async function appendSessionPollNotification({ pollId, moduleId, moduleTitle, pollTitle }) {
  if (!pollId || !moduleId) return;
  const list = await getStudentNotifications();
  const row = {
    id: genId(),
    kind: 'session_poll',
    pollId: String(pollId),
    moduleId: String(moduleId),
    moduleTitle: String(moduleTitle || '').trim() || 'Module',
    pollTitle: String(pollTitle || '').trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  const next = [row, ...list.filter((x) => x?.pollId !== row.pollId)].slice(0, MAX_ITEMS);
  await saveList(next);
  return row;
}

export async function markStudentNotificationRead(notificationId) {
  const list = await getStudentNotifications();
  let changed = false;
  const next = list.map((n) => {
    if (n.id === notificationId && !n.read) {
      changed = true;
      return { ...n, read: true };
    }
    return n;
  });
  if (changed) await saveList(next);
}

export async function markAllSessionPollNotificationsRead() {
  const list = await getStudentNotifications();
  const next = list.map((n) => ({ ...n, read: true }));
  await saveList(next);
}

export async function removeNotificationsForPoll(pollId) {
  if (!pollId) return;
  const list = await getStudentNotifications();
  const next = list.filter((n) => n.pollId !== String(pollId));
  await saveList(next);
}

export function formatNotificationAgo(iso) {
  try {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return '';
  }
}
