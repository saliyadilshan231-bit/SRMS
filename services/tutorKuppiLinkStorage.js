import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';

async function readModuleMap() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.tutorKuppiLinkByModule);
  if (!raw) return {};
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}

async function writeModuleMap(map) {
  await AsyncStorage.setItem(STORAGE_KEYS.tutorKuppiLinkByModule, JSON.stringify(map));
}

function entryUrl(entry) {
  if (entry == null) return '';
  if (typeof entry === 'string') return String(entry).trim();
  if (typeof entry === 'object' && entry.url != null) return String(entry.url).trim();
  return '';
}

function entryModuleTitle(entry) {
  if (entry && typeof entry === 'object' && entry.moduleTitle != null) {
    return String(entry.moduleTitle).trim();
  }
  return '';
}

/** Legacy single link (fallback if no per-module link). */
export async function getTutorKuppiMeetingLink() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.tutorKuppiMeetingLink);
  return String(raw || '').trim();
}

/**
 * @param {string} url Full meeting URL or empty to clear
 */
export async function setTutorKuppiMeetingLink(url) {
  const t = String(url || '').trim();
  if (t && !/^https?:\/\//i.test(t)) {
    throw new Error('Use a valid link starting with http:// or https://');
  }
  if (t) {
    await AsyncStorage.setItem(STORAGE_KEYS.tutorKuppiMeetingLink, t);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.tutorKuppiMeetingLink);
  }
}

export async function getTutorKuppiMeetingLinkForModule(moduleId) {
  const id = String(moduleId || '').trim();
  if (!id) return '';
  const map = await readModuleMap();
  return entryUrl(map[id]);
}

/**
 * @param {string} moduleId
 * @param {string} url Full meeting URL or empty to clear for this module
 * @param {string} [moduleTitle] Shown on the student dashboard (optional)
 */
export async function setTutorKuppiMeetingLinkForModule(moduleId, url, moduleTitle) {
  const id = String(moduleId || '').trim();
  if (!id) throw new Error('Module is required.');
  const t = String(url || '').trim();
  if (t && !/^https?:\/\//i.test(t)) {
    throw new Error('Use a valid link starting with http:// or https://');
  }
  const map = await readModuleMap();
  if (t) {
    const title = moduleTitle != null ? String(moduleTitle).trim() : '';
    map[id] = title ? { url: t, moduleTitle: title } : { url: t };
  } else {
    delete map[id];
  }
  await writeModuleMap(map);
}

/**
 * Modules that have a saved Kuppi meeting URL, for the student dashboard.
 * @returns {Promise<Array<{ moduleId: string, moduleTitle: string, url: string }>>}
 */
export async function getSavedKuppiModuleLinks() {
  const map = await readModuleMap();
  const out = [];
  for (const [moduleId, raw] of Object.entries(map)) {
    const url = entryUrl(raw);
    if (!url) continue;
    let moduleTitle = entryModuleTitle(raw);
    if (!moduleTitle) {
      const m = TIMED_QUIZ_MODULES.find((x) => String(x.id) === String(moduleId));
      moduleTitle = m?.title || `Module ${moduleId}`;
    }
    out.push({ moduleId, moduleTitle, url });
  }
  out.sort((a, b) => a.moduleTitle.localeCompare(b.moduleTitle));
  return out;
}

/**
 * One module’s saved Kuppi link (for detail screen). Returns null if missing.
 * @returns {Promise<{ moduleId: string, moduleTitle: string, url: string } | null>}
 */
export async function getSavedKuppiModuleLink(moduleId) {
  const id = String(moduleId || '').trim();
  if (!id) return null;
  const map = await readModuleMap();
  const raw = map[id];
  const url = entryUrl(raw);
  if (!url) return null;
  let moduleTitle = entryModuleTitle(raw);
  if (!moduleTitle) {
    const m = TIMED_QUIZ_MODULES.find((x) => String(x.id) === String(id));
    moduleTitle = m?.title || `Module ${id}`;
  }
  return { moduleId: id, moduleTitle, url };
}
