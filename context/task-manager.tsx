import {
  createNotificationInDB,
  createStudySessionInDB,
  createTaskInDB,
  deleteNotificationFromDB,
  getNotificationsByUser,
  getStudySessionsByUser,
  getTasksByUser,
  updateNotificationInDB,
  updateTaskInDB
} from '@/lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';

export type TaskType = 'Assignment' | 'Lab' | 'Quiz' | 'Study';
export type TaskCategory = 'Individual' | 'Group' | 'Revision';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';
export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late Submission';

export type TaskAttachment = {
  links: string[];
  files: string[];
};

export type SubmissionAttempt = {
  id: string;
  submittedAt: string;
  link?: string;
  fileName?: string;
  notes?: string;
  isLate: boolean;
  lateByHours: number;
};

export type ProgressEntry = {
  id: string;
  progress: number;
  status: TaskStatus;
  recordedAt: string;
};

export type StudySessionRecord = {
  id: string;
  taskId: string;
  startedAt: string;
  durationMinutes: number;
  breakMinutes: number;
  completed: boolean;
};

export type FocusPhase = 'running' | 'break';
export type FocusUIMode = 'prep' | 'focus';

export type SessionLog = {
  taskTitle: string;
  minutes: number;
  breakMin: number;
  time: string;
  date: string;
};

export type FocusSessionState = {
  uiMode: FocusUIMode;
  isPaused: boolean;
  phase: FocusPhase;
  secondsLeft: number;
  focusMin: number;
  breakMin: number;
  skipBreak: boolean;
  selectedTaskId: string;
  plantProgress: number;
  completedSessions: SessionLog[];
  showCompletionModal: boolean;
  isMinimized: boolean;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  categories: TaskCategory[];
  module: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  progress: number;
  status: TaskStatus;
  attachments: TaskAttachment;
  submissionStatus: SubmissionStatus;
  submissions: SubmissionAttempt[];
  progressHistory: ProgressEntry[];
  priority: string;
};

export type NotificationType = 'urgent' | 'warning' | 'smart' | 'success' | 'info' | 'muted';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  tag: string;
  icon: string;
  type: NotificationType;
  unread: boolean;
  relatedTaskId?: string;
};

type CreateTaskInput = {
  title: string;
  description: string;
  type: TaskType;
  categories: TaskCategory[];
  module: string;
  deadline?: string;
  priority: string;
  links?: string[];
  files?: string[];
};

type AddSubmissionInput = {
  taskId: string;
  link?: string;
  fileName?: string;
  notes?: string;
};

type UpdateProgressInput = {
  taskId: string;
  progress: number;
};

type TaskManagerContextType = {
  modules: string[];
  tasks: TaskItem[];
  sessions: StudySessionRecord[];
  focusSession: FocusSessionState;
  isSyncing: boolean;
  createTask: (input: CreateTaskInput) => Promise<string>;
  updateTaskProgress: (input: UpdateProgressInput) => Promise<void>;
  addSubmission: (input: AddSubmissionInput) => Promise<void>;
  logStudySession: (taskId: string, durationMinutes: number, breakMinutes: number, completed: boolean) => Promise<void>;
  // Focus Controls
  enterFocus: () => void;
  toggleFocus: () => void;
  resetFocus: () => void;
  exitFocus: () => void;
  dismissFocusModal: () => void;
  adjustFocusTime: (delta: number) => void;
  adjustBreakTime: (delta: number) => void;
  setFocusTask: (id: string) => void;
  setSkipBreak: (skip: boolean) => void;
  addQuickFocusTask: (title: string) => Promise<void>;
  setMinimized: (minimized: boolean) => void;
  // Notifications
  notifications: NotificationItem[];
  markNotifAsRead: (id: string) => void;
  markAllNotifsAsRead: () => void;
  deleteNotification: (id: string) => Promise<void>;
};

const modules = ['OOP', 'Database Systems', 'Data Structures', 'Software Engineering', 'Networks'];

const TaskManagerContext = createContext<TaskManagerContextType | null>(null);

function getNowIso() {
  return new Date().toISOString();
}

function toStatus(progress: number): TaskStatus {
  if (progress <= 0) return 'Not Started';
  if (progress >= 100) return 'Completed';
  return 'In Progress';
}

function hoursLate(submittedAt: string, deadline?: string) {
  if (!deadline) return 0;
  const lateMs = new Date(submittedAt).getTime() - new Date(deadline).getTime();
  return Math.max(0, Math.round(lateMs / (1000 * 60 * 60)));
}

export function TaskManagerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  // ── Focus Session State ───────────────────────────────
  const [focusSession, setFocusSession] = useState<FocusSessionState>({
    uiMode: 'prep',
    isPaused: true,
    phase: 'running',
    secondsLeft: 25 * 60,
    focusMin: 25,
    breakMin: 5,
    skipBreak: false,
    selectedTaskId: '',
    plantProgress: 0,
    completedSessions: [],
    showCompletionModal: false,
    isMinimized: false,
  });

  const [dbNotifications, setDbNotifications] = useState<NotificationItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Load dismissed IDs on mount
  useEffect(() => {
    async function loadDismissed() {
      try {
        const saved = await AsyncStorage.getItem('srms_dismissed_notifications');
        if (saved) setDismissedIds(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load dismissed notifications:', e);
      }
    }
    loadDismissed();
  }, []);

  // ── Appwrite Sync ─────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setSessions([]);
      setIsSyncing(false);
      return;
    }

    async function fetchData() {
      setIsSyncing(true);
      try {
        // Fetch tasks
        const taskDocs = await getTasksByUser(user!.$id);

        const mappedTasks: TaskItem[] = taskDocs.documents.map((doc: any) => ({
          id: doc.$id,
          title: doc.title,
          description: doc.description,
          type: doc.type,
          categories: Array.isArray(doc.categories) ? doc.categories : [doc.categories],
          module: doc.module,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          deadline: doc.deadline,
          progress: doc.progress,
          status: doc.status,
          priority: doc.priority || 'Medium',
          attachments: doc.attachments ? JSON.parse(doc.attachments) : { links: [], files: [] },
          submissionStatus: doc.submissionStatus || 'Not Submitted',
          submissions: doc.submissions ? JSON.parse(doc.submissions) : [],
          progressHistory: doc.progressHistory ? JSON.parse(doc.progressHistory) : []
        }));

        setTasks(mappedTasks);

        // Fetch sessions
        const sessionDocs = await getStudySessionsByUser(user!.$id);

        const mappedLogs: SessionLog[] = sessionDocs.documents.map((doc: any) => ({
          taskTitle: doc.taskTitle,
          minutes: Number(doc.minutes) || 0,
          breakMin: Number(doc.breakMin) || 0,
          time: doc.time,
          date: doc.$createdAt
        }));

        setFocusSession(prev => ({ ...prev, completedSessions: mappedLogs }));

        // Fetch Notifications
        const notifDocs = await getNotificationsByUser(user!.$id);

        const mappedNotifs: NotificationItem[] = notifDocs.documents.map((doc: any) => ({
          id: doc.$id,
          title: doc.title,
          body: doc.body,
          time: doc.time,
          tag: doc.tag,
          icon: doc.icon,
          type: doc.type,
          unread: doc.unread,
          relatedTaskId: doc.relatedTaskId
        }));

        setDbNotifications(mappedNotifs.sort((a, b) => (a.unread === b.unread ? 0 : a.unread ? -1 : 1)));

      } catch (error) {
        console.error('Failed to fetch data from Appwrite:', error);
      } finally {
        setIsSyncing(false);
      }
    }

    fetchData();
  }, [user]);

  // Background timer logic
  useEffect(() => {
    if (focusSession.isPaused) return;

    const interval = setInterval(() => {
      setFocusSession((prev) => {
        if (prev.secondsLeft <= 1) {
          if (prev.phase === 'running') {
            const nowTime = new Date();
            const timeStr = nowTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const selectedTask = tasks.find(t => t.id === prev.selectedTaskId);

            const newLog: SessionLog = {
              taskTitle: selectedTask?.title ?? 'Focus Session',
              minutes: prev.focusMin,
              breakMin: prev.skipBreak ? 0 : prev.breakMin,
              time: timeStr,
              date: new Date().toISOString()
            };

            // Sync to Appwrite
            if (user) {
              const selectedTaskObj = tasks.find(t => t.id === prev.selectedTaskId);
              createStudySessionInDB({
                userId: user.$id,
                taskId: prev.selectedTaskId || 'none',
                taskTitle: selectedTaskObj?.title ?? 'Focus Session',
                minutes: String(newLog.minutes),
                breakMin: String(newLog.breakMin),
                time: newLog.time
              }).catch(e => console.error('Failed to log session to Appwrite:', e));
            }

            if (prev.skipBreak) {
              return {
                ...prev,
                isPaused: true,
                phase: 'running',
                secondsLeft: prev.focusMin * 60,
                plantProgress: prev.plantProgress + 1,
                completedSessions: [newLog, ...prev.completedSessions],
                showCompletionModal: true,
              };
            }
            return {
              ...prev,
              phase: 'break',
              secondsLeft: prev.breakMin * 60,
              plantProgress: prev.plantProgress + 1,
              completedSessions: [newLog, ...prev.completedSessions],
              showCompletionModal: true,
            };
          }
          return {
            ...prev,
            isPaused: true,
            phase: 'running',
            secondsLeft: prev.focusMin * 60,
          };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusSession.isPaused, tasks, user]);

  useEffect(() => {
    if (tasks.length > 0 && !focusSession.selectedTaskId) {
      setFocusSession(p => ({ ...p, selectedTaskId: tasks[0].id }));
    }
  }, [tasks]);

  // ── Notification Engine (Persistent Sync) ────────────────
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const syncNotifs = async () => {
      const now = new Date();
      const newItems: Omit<NotificationItem, 'id'>[] = [];

      tasks.forEach(task => {
        const deadline = task.deadline ? new Date(task.deadline) : null;
        const isCompleted = task.status === 'Completed';

        // 1. Overdue
        if (deadline && deadline < now && !isCompleted) {
          const stableId = `overdue-${task.id}`;
          if (!dbNotifications.some(n => n.id.includes(stableId)) && !dismissedIds.includes(stableId)) {
            newItems.push({
              title: 'Overdue Task Detected',
              body: `${task.title} was due and is still Not Submitted.`,
              time: 'Action Required',
              tag: 'OVERDUE',
              icon: '⏰',
              type: 'warning',
              unread: true,
              relatedTaskId: task.id
            });
          }
        }

        // 2. Urgent (Due in next 24h)
        if (deadline && deadline > now && (deadline.getTime() - now.getTime()) < 24 * 60 * 60 * 1000 && !isCompleted) {
          const stableId = `urgent-${task.id}`;
          if (!dbNotifications.some(n => n.id.includes(stableId)) && !dismissedIds.includes(stableId)) {
            newItems.push({
              title: 'Deadline Approaching',
              body: `${task.title} is due very soon. Current progress: ${task.progress}%.`,
              time: 'Urgent',
              tag: 'URGENT',
              icon: '🚨',
              type: 'urgent',
              unread: true,
              relatedTaskId: task.id
            });
          }
        }

        // 3. Smart Tip (0% progress but due in < 3 days)
        if (deadline && deadline > now && task.progress === 0 && (deadline.getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000) {
          const stableId = `smart-${task.id}`;
          if (!dbNotifications.some(n => n.id.includes(stableId)) && !dismissedIds.includes(stableId)) {
            newItems.push({
              title: 'Ready to Start?',
              body: `You haven't started ${task.title} yet. It's due in a few days.`,
              time: 'Smart Tip',
              tag: 'SMART TIP',
              icon: '🤖',
              type: 'smart',
              unread: true,
              relatedTaskId: task.id
            });
          }
        }

        // 4. Success (Completed recently - last 24h)
        if (isCompleted && task.updatedAt) {
          const updated = new Date(task.updatedAt);
          if ((now.getTime() - updated.getTime()) < 24 * 60 * 60 * 1000) {
            const stableId = `success-${task.id}`;
            if (!dbNotifications.some(n => n.id.includes(stableId)) && !dismissedIds.includes(stableId)) {
              newItems.push({
                title: 'Task Completed!',
                body: `${task.title} marked as done. Great work!`,
                time: 'Success',
                tag: 'COMPLETED',
                icon: '✅',
                type: 'success',
                unread: true,
                relatedTaskId: task.id
              });
            }
          }
        }
      });

      // Post New Notifications
      for (const item of newItems) {
        try {
          const doc = await createNotificationInDB({
            userId: user.$id,
            ...item,
            stableId: `${item.type}-${item.relatedTaskId}` // for future duplicates
          });
          setDbNotifications(prev => [{ id: doc.$id, ...item }, ...prev]);
        } catch (e) {
          console.error('Failed to create persistent notification:', e);
        }
      }
    };

    syncNotifs();
  }, [tasks, user]);

  async function markNotifAsRead(id: string) {
    try {
      await updateNotificationInDB(id, { unread: false });
      setDbNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  }

  async function markAllNotifsAsRead() {
    const unread = dbNotifications.filter(n => n.unread);
    for (const n of unread) {
      markNotifAsRead(n.id);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await deleteNotificationFromDB(id);
      // Track stable ID to prevent re-creation
      const notif = dbNotifications.find(n => n.id === id);
      if (notif && notif.relatedTaskId) {
        const stableId = `${notif.type}-${notif.relatedTaskId}`;
        const newDismissed = [...dismissedIds, stableId];
        setDismissedIds(newDismissed);
        AsyncStorage.setItem('srms_dismissed_notifications', JSON.stringify(newDismissed));
      }
      setDbNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  }

  async function createTask(input: CreateTaskInput) {
    if (!user) throw new Error('User not logged in');
    const now = getNowIso();
    const progress = 0;
    const status = toStatus(progress);

    const attachments = {
      links: input.links?.filter(Boolean) ?? [],
      files: input.files?.filter(Boolean) ?? [],
    };

    const docData = {
      userId: user.$id,
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      categories: input.categories, // Appwrite supports string arrays
      module: input.module,
      deadline: input.deadline,
      progress,
      status,
      priority: input.priority,
      createdAt: now,
      updatedAt: now,
      attachments: JSON.stringify(attachments),
      submissionStatus: 'Not Submitted',
      submissions: JSON.stringify([]),
      progressHistory: JSON.stringify([{ id: `PH-${Date.now()}`, progress, status, recordedAt: now }])
    };

    try {
      const doc = await createTaskInDB(docData);
      const newTask: TaskItem = {
        id: doc.$id,
        ...input,
        createdAt: now,
        updatedAt: now,
        progress,
        status,
        attachments,
        submissionStatus: 'Not Submitted',
        submissions: [],
        progressHistory: JSON.parse(docData.progressHistory)
      };
      setTasks(prev => [newTask, ...prev]);
      return doc.$id;
    } catch (error) {
      console.error('Appwrite createTask error:', error);
      throw error;
    }
  }

  async function updateTaskProgress({ taskId, progress }: UpdateProgressInput) {
    if (!user) return;
    const bounded = Math.min(100, Math.max(0, Math.round(progress)));
    const status = toStatus(bounded);
    const now = getNowIso();

    // Find the task locally first for optimistic update
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newHistory = [
      { id: `PH-${Date.now()}`, progress: bounded, status, recordedAt: now },
      ...task.progressHistory
    ];

    try {
      await updateTaskInDB(taskId, {
        progress: bounded,
        status,
        updatedAt: now,
        progressHistory: JSON.stringify(newHistory)
      });

      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        progress: bounded,
        status,
        updatedAt: now,
        progressHistory: newHistory
      } : t));
    } catch (error) {
      console.error('Appwrite updateTaskProgress error:', error);
      throw error;
    }
  }

  async function addSubmission({ taskId, link, fileName, notes }: AddSubmissionInput) {
    if (!user) return;
    const now = getNowIso();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const lateByHours = hoursLate(now, task.deadline);
    const isLate = lateByHours > 0;
    const attempt: SubmissionAttempt = {
      id: `SUB-${Date.now()}`,
      submittedAt: now,
      link: link?.trim() || undefined,
      fileName: fileName?.trim() || undefined,
      notes: notes?.trim() || undefined,
      isLate,
      lateByHours,
    };

    const newSubmissions = [attempt, ...task.submissions];
    const newStatus = isLate ? 'Late Submission' : 'Submitted';

    try {
      await updateTaskInDB(taskId, {
        updatedAt: now,
        submissions: JSON.stringify(newSubmissions),
        submissionStatus: newStatus
      });

      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        updatedAt: now,
        submissions: newSubmissions,
        submissionStatus: newStatus as SubmissionStatus
      } : t));
    } catch (error) {
      console.error('Appwrite addSubmission error:', error);
      throw error;
    }
  }

  async function logStudySession(taskId: string, durationMinutes: number, breakMinutes: number, completed: boolean) {
    // This is for internal record tracking if needed, currently sessions are logged when focus timer ends
  }

  // ── Focus Controls ────────────────────────────────────
  function enterFocus() {
    setFocusSession(p => ({
      ...p,
      uiMode: 'focus',
      isPaused: true,
      phase: 'running',
      secondsLeft: p.focusMin * 60,
      showCompletionModal: false,
      isMinimized: false
    }));
  }
  function toggleFocus() {
    setFocusSession(p => ({ ...p, isPaused: !p.isPaused }));
  }
  function resetFocus() {
    setFocusSession(p => ({
      ...p,
      isPaused: true,
      secondsLeft: p.phase === 'running' ? p.focusMin * 60 : p.breakMin * 60,
      showCompletionModal: false
    }));
  }
  function exitFocus() {
    setFocusSession(p => ({ ...p, uiMode: 'prep', isPaused: true, showCompletionModal: false, isMinimized: false }));
  }
  function dismissFocusModal() {
    setFocusSession(p => ({ ...p, showCompletionModal: false }));
  }
  function setMinimized(minimized: boolean) {
    setFocusSession(p => ({ ...p, isMinimized: minimized }));
  }
  function adjustFocusTime(delta: number) {
    setFocusSession(p => {
      const next = Math.min(120, Math.max(5, p.focusMin + delta));
      if (p.uiMode === 'prep') {
        return { ...p, focusMin: next, secondsLeft: next * 60 };
      }
      return { ...p, focusMin: next };
    });
  }
  function adjustBreakTime(delta: number) {
    setFocusSession(p => {
      const next = Math.min(30, Math.max(1, p.breakMin + delta));
      return { ...p, breakMin: next };
    });
  }
  function setFocusTask(id: string) {
    setFocusSession(p => ({ ...p, selectedTaskId: id }));
  }
  function setSkipBreak(skip: boolean) {
    setFocusSession(p => ({ ...p, skipBreak: skip }));
  }
  async function addQuickFocusTask(title: string) {
    const id = await createTask({
      title,
      description: 'Quick added from Focus session',
      type: 'Study',
      categories: ['Individual'],
      module: 'General',
      priority: 'Medium'
    });
    setFocusSession(p => ({ ...p, selectedTaskId: id }));
  }

  const value = useMemo(
    () => ({
      modules,
      tasks,
      sessions,
      focusSession,
      isSyncing,
      createTask,
      updateTaskProgress,
      addSubmission,
      logStudySession,
      enterFocus,
      toggleFocus,
      resetFocus,
      exitFocus,
      dismissFocusModal,
      adjustFocusTime,
      adjustBreakTime,
      setFocusTask,
      setSkipBreak,
      addQuickFocusTask,
      setMinimized,
      notifications: dbNotifications,
      markNotifAsRead,
      markAllNotifsAsRead,
      deleteNotification,
    }),
    [tasks, sessions, focusSession, isSyncing, dbNotifications, dismissedIds]
  );

  return <TaskManagerContext.Provider value={value}>{children}</TaskManagerContext.Provider>;
}

export function useTaskManager() {
  const ctx = useContext(TaskManagerContext);
  if (!ctx) {
    throw new Error('useTaskManager must be used within TaskManagerProvider');
  }
  return ctx;
}
