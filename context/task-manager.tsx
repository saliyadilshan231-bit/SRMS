import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'srms_task_manager_v1';

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
};

type CreateTaskInput = {
  title: string;
  description: string;
  type: TaskType;
  categories: TaskCategory[];
  module: string;
  deadline?: string;
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
  createTask: (input: CreateTaskInput) => void;
  updateTaskProgress: (input: UpdateProgressInput) => void;
  addSubmission: (input: AddSubmissionInput) => void;
  logStudySession: (taskId: string, durationMinutes: number, breakMinutes: number, completed: boolean) => void;
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

function seedTasks(): TaskItem[] {
  const now = getNowIso();
  return [
    {
      id: 'TASK-1001',
      title: 'OOP Assignment 02',
      description: 'Implement polymorphism examples and submit report.',
      type: 'Assignment',
      categories: ['Individual'],
      module: 'OOP',
      createdAt: now,
      updatedAt: now,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 45,
      status: 'In Progress',
      attachments: { links: ['https://classroom.example/oop/a2'], files: ['requirements.pdf'] },
      submissionStatus: 'Not Submitted',
      submissions: [],
      progressHistory: [
        { id: 'PH-1', progress: 0, status: 'Not Started', recordedAt: now },
        { id: 'PH-2', progress: 45, status: 'In Progress', recordedAt: now },
      ],
    },
    {
      id: 'TASK-1002',
      title: 'DS Quiz Revision',
      description: 'Revise trees, heaps, and graphs before Friday quiz.',
      type: 'Study',
      categories: ['Revision', 'Individual'],
      module: 'Data Structures',
      createdAt: now,
      updatedAt: now,
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 0,
      status: 'Not Started',
      attachments: { links: [], files: [] },
      submissionStatus: 'Not Submitted',
      submissions: [],
      progressHistory: [{ id: 'PH-3', progress: 0, status: 'Not Started', recordedAt: now }],
    },
  ];
}

export function TaskManagerProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (!raw) {
          setTasks(seedTasks());
          setSessions([]);
          return;
        }
        const parsed = JSON.parse(raw) as { tasks?: TaskItem[]; sessions?: StudySessionRecord[] };
        setTasks(parsed.tasks ?? seedTasks());
        setSessions(parsed.sessions ?? []);
      } catch {
        if (mounted) {
          setTasks(seedTasks());
          setSessions([]);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, sessions })).catch(() => undefined);
  }, [tasks, sessions]);

  function createTask(input: CreateTaskInput) {
    const now = getNowIso();
    const id = `TASK-${Date.now()}`;
    const progress = 0;
    const status = toStatus(progress);
    const task: TaskItem = {
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      categories: input.categories,
      module: input.module,
      createdAt: now,
      updatedAt: now,
      deadline: input.deadline,
      progress,
      status,
      attachments: {
        links: input.links?.filter(Boolean) ?? [],
        files: input.files?.filter(Boolean) ?? [],
      },
      submissionStatus: 'Not Submitted',
      submissions: [],
      progressHistory: [{ id: `PH-${Date.now()}`, progress, status, recordedAt: now }],
    };

    setTasks((prev) => [task, ...prev]);
  }

  function updateTaskProgress({ taskId, progress }: UpdateProgressInput) {
    const bounded = Math.min(100, Math.max(0, Math.round(progress)));
    const status = toStatus(bounded);
    const now = getNowIso();

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          progress: bounded,
          status,
          updatedAt: now,
          progressHistory: [
            {
              id: `PH-${Date.now()}`,
              progress: bounded,
              status,
              recordedAt: now,
            },
            ...task.progressHistory,
          ],
        };
      })
    );
  }

  function addSubmission({ taskId, link, fileName, notes }: AddSubmissionInput) {
    const now = getNowIso();

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

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

        return {
          ...task,
          updatedAt: now,
          submissions: [attempt, ...task.submissions],
          submissionStatus: isLate ? 'Late Submission' : 'Submitted',
        };
      })
    );
  }

  function logStudySession(taskId: string, durationMinutes: number, breakMinutes: number, completed: boolean) {
    const now = getNowIso();
    const record: StudySessionRecord = {
      id: `SES-${Date.now()}`,
      taskId,
      startedAt: now,
      durationMinutes,
      breakMinutes,
      completed,
    };

    setSessions((prev) => [record, ...prev]);
  }

  const value = useMemo(
    () => ({
      modules,
      tasks,
      sessions,
      createTask,
      updateTaskProgress,
      addSubmission,
      logStudySession,
    }),
    [tasks, sessions]
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
