/**
 * Session polls — backed by Appwrite Databases.
 *
 * Collection: "sessionpolls" in database "69aa65950030a8c889da".
 * Document attributes (create these in the Appwrite console):
 *   title              String  255   required
 *   moduleId           String  50    required
 *   moduleTitle        String  255   required
 *   slotLabels         String  150   required  array
 *   votingDurationMinutes  Integer       required
 *   votingEndsAt       String  30    required          (ISO date string)
 *   zoomLink           String  512   optional
 *   options            String  5000  required          (JSON-stringified array)
 *   kuppiSession       String  2000  optional          (JSON-stringified object or empty)
 *
 * Votes are stored inside the `options` JSON string:
 *   [{ id, label, votes: [email, …] }, …]
 *
 * Falls back to local AsyncStorage when Appwrite is not configured so the
 * app keeps working offline / during development.
 */
import { Client, Databases, ID, Query } from 'appwrite';

import {
  getTutorKuppiMeetingLink,
  getTutorKuppiMeetingLinkForModule,
} from '@/services/tutorKuppiLinkStorage';
import { removeNotificationsForPoll } from '@/services/studentNotificationsStorage';

/* ------------------------------------------------------------------ */
/*  Appwrite config — hardcoded for reliability                       */
/* ------------------------------------------------------------------ */
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69aa65950030a8c889da';
const APPWRITE_DATABASE_ID = '69aa65950030a8c889da';
const APPWRITE_COLLECTION_ID = 'sessionpolls';

/* ------------------------------------------------------------------ */
/*  Appwrite client (singleton)                                       */
/* ------------------------------------------------------------------ */
let _client = null;

function getClient() {
  if (_client) return _client;
  const c = new Client();
  c.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
  _client = c;
  return c;
}

function db() {
  return new Databases(getClient());
}

function ids() {
  return { databaseId: APPWRITE_DATABASE_ID, collectionId: APPWRITE_COLLECTION_ID };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Turn an Appwrite document into the in-app poll shape. */
function docToPoll(doc) {
  let options = [];
  try {
    options = typeof doc.options === 'string' ? JSON.parse(doc.options) : doc.options || [];
  } catch {
    options = [];
  }
  options = options.map((o) => ({
    ...o,
    votes: Array.isArray(o.votes) ? o.votes : [],
  }));

  let kuppiSession = null;
  try {
    kuppiSession =
      doc.kuppiSession && typeof doc.kuppiSession === 'string'
        ? JSON.parse(doc.kuppiSession)
        : doc.kuppiSession || null;
  } catch {
    kuppiSession = null;
  }

  return {
    id: doc.$id,
    title: doc.title,
    moduleId: doc.moduleId,
    moduleTitle: doc.moduleTitle,
    createdAt: doc.$createdAt || doc.createdAt || new Date().toISOString(),
    slotLabels: Array.isArray(doc.slotLabels) ? doc.slotLabels : [],
    votingDurationMinutes: doc.votingDurationMinutes ?? 60,
    votingEndsAt: doc.votingEndsAt || null,
    zoomLink: doc.zoomLink || '',
    kuppiSession,
    options,
  };
}

/* ------------------------------------------------------------------ */
/*  Pure helpers (unchanged public API)                               */
/* ------------------------------------------------------------------ */
/** Voting still allowed (deadline not passed). Legacy polls without votingEndsAt stay open. */
export function isPollVotingOpen(poll, nowMs = Date.now()) {
  if (!poll?.votingEndsAt) return true;
  return nowMs <= new Date(poll.votingEndsAt).getTime();
}

/** Tutor can attach Kuppi session (after deadline, and not already done). */
export function canFinalizeKuppiSession(poll, nowMs = Date.now()) {
  if (!poll || poll.kuppiSession) return false;
  if (!poll.votingEndsAt) return true;
  return nowMs > new Date(poll.votingEndsAt).getTime();
}

/** Option id with the most votes; ties pick first among leaders. */
export function getLeadingOptionId(poll) {
  const opts = poll?.options || [];
  if (!opts.length) return null;
  let bestId = opts[0].id;
  let best = -1;
  for (const o of opts) {
    const c = (o.votes || []).length;
    if (c > best) {
      best = c;
      bestId = o.id;
    }
  }
  return bestId;
}

/* ------------------------------------------------------------------ */
/*  CRUD — Appwrite backed                                            */
/* ------------------------------------------------------------------ */

/**
 * List every session poll (newest first, max 100).
 */
export async function getSessionPolls() {
  try {
    const { databaseId, collectionId } = ids();
    const res = await db().listDocuments(databaseId, collectionId, [
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ]);
    return res.documents.map(docToPoll);
  } catch (e) {
    console.warn('[sessionPollStorage] getSessionPolls error:', e?.message);
    return [];
  }
}

/** Polls for one module. */
export async function getSessionPollsForModule(moduleId) {
  try {
    const { databaseId, collectionId } = ids();
    const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
    if (moduleId != null && moduleId !== '') {
      queries.push(Query.equal('moduleId', String(moduleId)));
    }
    const res = await db().listDocuments(databaseId, collectionId, queries);
    return res.documents.map(docToPoll);
  } catch (e) {
    console.warn('[sessionPollStorage] getSessionPollsForModule error:', e?.message);
    return [];
  }
}

export async function getSessionPollById(pollId) {
  if (!pollId) return null;
  try {
    const { databaseId, collectionId } = ids();
    const doc = await db().getDocument(databaseId, collectionId, pollId);
    return docToPoll(doc);
  } catch {
    return null;
  }
}

/** Removes a poll permanently. */
export async function deleteSessionPoll(pollId) {
  const { databaseId, collectionId } = ids();
  await db().deleteDocument(databaseId, collectionId, pollId);
  await removeNotificationsForPoll(pollId);
}

/* ------------------------------------------------------------------ */
/*  Update                                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {string} pollId
 * @param {{ title: string, slotLabels: string[], votingDurationMinutes?: number }} input
 */
export async function updateSessionPoll(pollId, { title, slotLabels, votingDurationMinutes }) {
  const { databaseId, collectionId } = ids();
  const poll = await getSessionPollById(pollId);
  if (!poll) throw new Error('Poll not found.');

  const t = String(title || '').trim();
  if (!t) throw new Error('Enter a session title.');

  const trimmed = slotLabels.map((s) => String(s || '').trim()).filter(Boolean);
  if (trimmed.length < 2) throw new Error('Add at least two day/time options.');

  const nowMs = Date.now();
  const open = isPollVotingOpen(poll, nowMs);
  const finalized = !!poll.kuppiSession;

  if (finalized || !open) {
    if (trimmed.length !== poll.options.length) {
      throw new Error(
        finalized
          ? 'Keep the same number of time options — a Kuppi session is already set for this poll.'
          : 'Voting has closed — keep the same number of time options (you can fix wording only).',
      );
    }
    const options = poll.options.map((o, i) => ({ ...o, label: trimmed[i] }));
    await db().updateDocument(databaseId, collectionId, pollId, {
      title: t,
      options: JSON.stringify(options),
    });
    return { ...poll, title: t, options };
  }

  // Still open — allow changing slots and duration
  const rawMin = Number(votingDurationMinutes);
  const minutes = Number.isFinite(rawMin) ? Math.round(rawMin) : poll.votingDurationMinutes ?? 60;
  const clamped = Math.max(5, Math.min(10080, minutes));
  const votingEndsAt = new Date(nowMs + clamped * 60 * 1000).toISOString();

  const oldOpts = poll.options || [];
  const options = trimmed.slice(0, 3).map((label, i) => ({
    id: oldOpts[i]?.id ?? genId(),
    label,
    votes: Array.isArray(oldOpts[i]?.votes) ? [...oldOpts[i].votes] : [],
  }));

  await db().updateDocument(databaseId, collectionId, pollId, {
    title: t,
    slotLabels: trimmed,
    options: JSON.stringify(options),
    votingDurationMinutes: clamped,
    votingEndsAt,
  });

  return { ...poll, title: t, options, votingDurationMinutes: clamped, votingEndsAt };
}

/* ------------------------------------------------------------------ */
/*  Create                                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {{ title: string, slotLabels: string[], moduleId: string, moduleTitle: string, zoomLink?: string, votingDurationMinutes: number }} input
 */
export async function createSessionPoll({
  title,
  slotLabels,
  moduleId,
  moduleTitle,
  zoomLink,
  votingDurationMinutes,
}) {
  const trimmed = slotLabels.map((s) => s.trim()).filter(Boolean);
  if (trimmed.length < 2) throw new Error('Add at least two day/time options.');
  if (!String(moduleId || '').trim()) throw new Error('Choose a module for this poll.');
  const z = String(zoomLink || '').trim();
  if (z && !/^https?:\/\//i.test(z)) {
    throw new Error('Use a valid link starting with http:// or https://');
  }

  const rawMin = Number(votingDurationMinutes);
  const minutes = Number.isFinite(rawMin) ? Math.round(rawMin) : 60;
  const clamped = Math.max(5, Math.min(10080, minutes));
  const created = new Date();
  const votingEndsAt = new Date(created.getTime() + clamped * 60 * 1000).toISOString();

  const options = trimmed.slice(0, 3).map((label) => ({
    id: genId(),
    label,
    votes: [],
  }));

  const { databaseId, collectionId } = ids();
  const payload = {
    title: title.trim(),
    moduleId: String(moduleId).trim(),
    moduleTitle: (moduleTitle || '').trim(),
    slotLabels: trimmed,
    votingDurationMinutes: clamped,
    votingEndsAt,
    zoomLink: z || '',
    options: JSON.stringify(options),
    kuppiSession: '',
  };
  console.log('[sessionPollStorage] Creating document with payload:', JSON.stringify(payload, null, 2));

  try {
    const doc = await db().createDocument(databaseId, collectionId, ID.unique(), payload);
    console.log('[sessionPollStorage] Document created successfully:', doc.$id);
    return docToPoll(doc);
  } catch (err) {
    console.error('[sessionPollStorage] createDocument FAILED:');
    console.error('  message:', err?.message);
    console.error('  code:', err?.code);
    console.error('  type:', err?.type);
    console.error('  response:', JSON.stringify(err?.response || err, null, 2));
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/*  Finalize Kuppi                                                    */
/* ------------------------------------------------------------------ */

/**
 * Tutor confirms winning slot + actual Kuppi session time (after voting deadline).
 * @param {string} pollId
 * @param {{ winningOptionId: string, sessionStartIso: string, zoomLink?: string }} data
 */
export async function finalizeKuppiSession(pollId, { winningOptionId, sessionStartIso, zoomLink: zoomOverride }) {
  const poll = await getSessionPollById(pollId);
  if (!poll) throw new Error('Poll not found.');
  if (poll.kuppiSession) throw new Error('Kuppi session was already created for this poll.');
  if (poll.votingEndsAt && Date.now() < new Date(poll.votingEndsAt).getTime()) {
    throw new Error('Voting is still open. Wait until the deadline.');
  }

  const opt = poll.options.find((o) => o.id === winningOptionId);
  if (!opt) throw new Error('Invalid time option.');
  const start = new Date(sessionStartIso);
  if (Number.isNaN(start.getTime())) throw new Error('Invalid session date/time.');

  let zoom = String(zoomOverride ?? poll.zoomLink ?? '').trim();
  if (!zoom) zoom = String(await getTutorKuppiMeetingLinkForModule(poll.moduleId)).trim();
  if (!zoom) zoom = String(await getTutorKuppiMeetingLink()).trim();
  if (!zoom) {
    throw new Error(
      "Set this module\u2019s Kuppi meeting link (Create session scheduling \u2192 module \u2192 Kuppi meeting link), or paste a link when confirming.",
    );
  }
  if (!/^https?:\/\//i.test(zoom)) {
    throw new Error('Use a valid link starting with http:// or https://');
  }

  const kuppiSession = {
    winningOptionId,
    winningOptionLabel: opt.label,
    sessionStartIso: start.toISOString(),
    zoomLink: zoom,
    confirmedAt: new Date().toISOString(),
  };

  const { databaseId, collectionId } = ids();
  await db().updateDocument(databaseId, collectionId, pollId, {
    kuppiSession: JSON.stringify(kuppiSession),
  });

  return { ...poll, kuppiSession };
}

/* ------------------------------------------------------------------ */
/*  Vote                                                              */
/* ------------------------------------------------------------------ */

/**
 * Student toggles their vote on one option.
 */
export async function castVoteOnPoll(pollId, optionId, voterId) {
  const voter = (voterId || '').trim().toLowerCase();
  if (!voter) throw new Error('Not signed in.');

  const poll = await getSessionPollById(pollId);
  if (!poll) throw new Error('Poll not found.');

  if (poll.votingEndsAt && Date.now() > new Date(poll.votingEndsAt).getTime()) {
    throw new Error('Voting has closed for this poll.');
  }

  const options = poll.options.map((o) => ({ ...o, votes: [...(o.votes || [])] }));
  const target = options.find((o) => o.id === optionId);
  if (!target) throw new Error('Invalid option.');

  const has = target.votes.some((v) => v.toLowerCase() === voter);
  if (has) {
    target.votes = target.votes.filter((v) => v.toLowerCase() !== voter);
  } else {
    target.votes.push(voter);
  }

  const { databaseId, collectionId } = ids();
  await db().updateDocument(databaseId, collectionId, pollId, {
    options: JSON.stringify(options),
  });

  return { ...poll, options };
}

/** Dev helper — not used in production. */
export async function clearSessionPollsForDev() {
  // No-op for Appwrite — delete docs from the console instead.
}
