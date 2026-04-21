import { Account, Client, Databases, ID, Query } from 'appwrite';
import { Alert } from 'react-native';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '69aa65950030a8c889da');

export const account = new Account(client);
export const databases = new Databases(client);

// ── Database & Collection IDs ──────────────────────────────
export const DATABASE_ID = '69aa65950030a8c889da';
export const MOOD_LOGS_COLLECTION_ID = 'mood_logs';
export const COUNSELORS_COLLECTION_ID = 'counselors';
export const BOOKINGS_COLLECTION_ID = 'bookings';
export const SCREENER_RESULTS_COLLECTION_ID = 'screener_results';
export const TASKS_COLLECTION_ID = 'tasks';
export const SESSIONS_COLLECTION_ID = 'sessions';
export const NOTIFICATIONS_COLLECTION_ID = 'notifications';
export const KUPPI_MATERIALS_COLLECTION_ID = 'kuppi_materials';

// ── Database Operations ──────────────────────────────────

/** Task Management Helpers */
export const getTasksByUser = async (userId: string) => {
  return await databases.listDocuments(DATABASE_ID, TASKS_COLLECTION_ID, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
  ]);
};

export const createTaskInDB = async (data: any) => {
  return await databases.createDocument(DATABASE_ID, TASKS_COLLECTION_ID, ID.unique(), data);
};

export const updateTaskInDB = async (taskId: string, data: any) => {
  return await databases.updateDocument(DATABASE_ID, TASKS_COLLECTION_ID, taskId, data);
};

export const deleteTaskInDB = async (taskId: string) => {
  return await databases.deleteDocument(DATABASE_ID, TASKS_COLLECTION_ID, taskId);
};

/** Study Session Helpers */
export const getStudySessionsByUser = async (userId: string) => {
  return await databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION_ID, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
  ]);
};

export const createStudySessionInDB = async (data: any) => {
  return await databases.createDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, ID.unique(), data);
};

/** Notification Helpers */
export const getNotificationsByUser = async (userId: string) => {
  return await databases.listDocuments(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
  ]);
};

export const createNotificationInDB = async (data: any) => {
  return await databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, ID.unique(), data);
};

export const updateNotificationInDB = async (notifId: string, data: any) => {
  return await databases.updateDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notifId, data);
};

export const deleteNotificationFromDB = async (notifId: string) => {
  return await databases.deleteDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notifId);
};

// ── Types ──────────────────────────────────────────────────
export interface CounselorDoc {
  $id?: string;
  userId: string;
  name: string;
  specialty: string;
  availability: string; // JSON stringified array
  avatar: string;
}

export interface BookingDoc {
  $id?: string;
  counselorId: string;
  studentId: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  reason: string;
  mode?: string;
}

// ── Mood-log helpers ───────────────────────────────────────

export interface MoodLogPayload {
  moodLevel: number;
  factors: string[];
  journal: string | null;
}

/**
 * Save a mood check-in to the Appwrite `mood_logs` collection.
 */
export const saveMoodLog = async (log: MoodLogPayload) => {
  const currentUser = await account.get();
  const document = await databases.createDocument(
    DATABASE_ID,
    MOOD_LOGS_COLLECTION_ID,
    ID.unique(),
    {
      studentId: currentUser.$id,
      moodLevel: log.moodLevel.toString(),
      factors: JSON.stringify(log.factors),
      journal: log.journal ?? '',
      date: new Date().toISOString(),
    }
  );
  return document;
};

/** Fetch mood logs for specific student IDs (used by counselor dashboard) */
export const getMoodLogsByStudentIds = async (studentIds: string[]) => {
  if (studentIds.length === 0) return [];
  try {
    const res = await databases.listDocuments(DATABASE_ID, MOOD_LOGS_COLLECTION_ID, [
      Query.equal('studentId', studentIds),
      Query.orderDesc('date'),
      Query.limit(50),
    ]);
    return res.documents;
  } catch (error: any) {
    console.warn("DB getMoodLogs error:", error?.message);
    if (error?.message?.includes('Index')) {
       Alert.alert("Appwrite Index Missing", "You need to add an Index for 'studentId' in the mood_logs collection so counselors can filter by their patients.");
    }
    return [];
  }
};

// ── Counselor helpers ──────────────────────────────────────

/** Get a counselor profile by their Appwrite Auth userId */
export const getCounselorByUserId = async (userId: string): Promise<CounselorDoc | null> => {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COUNSELORS_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);
    if (res.documents.length === 0) return null;
    const d = res.documents[0] as any;
    return {
      $id: d.$id,
      userId: d.userId,
      name: d.name,
      specialty: d.specialty,
      availability: d.availability,
      avatar: d.avatar ?? '👩‍⚕️',
    };
  } catch (error: any) {
    console.warn("DB getCounselor error:", error?.message);
    if (error?.message?.includes('Index')) {
       Alert.alert("Appwrite Index Missing", "You need to add an Index for 'userId' in the counselors collection.");
    }
    return null;
  }
};

/** List all counselors */
export const listCounselors = async (): Promise<CounselorDoc[]> => {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COUNSELORS_COLLECTION_ID, [
      Query.limit(50),
    ]);
    return res.documents.map((d: any) => ({
      $id: d.$id,
      userId: d.userId,
      name: d.name,
      specialty: d.specialty,
      availability: d.availability,
      avatar: d.avatar ?? '👩‍⚕️',
    }));
  } catch {
    return [];
  }
};

/** Create a counselor profile (called on first admin login) */
export const createCounselorProfile = async (data: {
  userId: string;
  name: string;
  specialty?: string;
  availability?: string[];
  avatar?: string;
}): Promise<CounselorDoc> => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COUNSELORS_COLLECTION_ID,
      ID.unique(),
      {
        userId: data.userId,
        name: data.name,
        specialty: data.specialty ?? 'General Wellbeing',
        availability: JSON.stringify(data.availability ?? ['10:00 AM', '1:00 PM', '3:00 PM']),
        avatar: data.avatar ?? '👩‍⚕️',
      }
    );
    return doc as any;
  } catch (error: any) {
    Alert.alert("Appwrite DB Error", "Could not create Counselor Profile! Check your Collection settings:\n\n" + error.message);
    throw error;
  }
};

/** Update counselor availability */
export const updateCounselorAvailability = async (
  documentId: string,
  availability: string[]
): Promise<void> => {
  await databases.updateDocument(DATABASE_ID, COUNSELORS_COLLECTION_ID, documentId, {
    availability: JSON.stringify(availability),
  });
};

/** Update counselor specialty */
export const updateCounselorProfile = async (
  documentId: string,
  data: Partial<{ name: string; specialty: string; avatar: string }>
): Promise<void> => {
  await databases.updateDocument(DATABASE_ID, COUNSELORS_COLLECTION_ID, documentId, data);
};

// ── Booking helpers ────────────────────────────────────────

/** List bookings for a specific counselor (by their userId) */
export const getBookingsByCounselor = async (counselorUserId: string): Promise<BookingDoc[]> => {
  try {
    const res = await databases.listDocuments(DATABASE_ID, BOOKINGS_COLLECTION_ID, [
      Query.equal('counselorId', counselorUserId),
      Query.orderDesc('date'),
      Query.limit(100),
    ]);
    return res.documents.map((d: any) => ({
      $id: d.$id,
      counselorId: d.counselorId,
      studentId: d.studentId,
      date: d.date,
      time: d.time,
      status: d.status,
      reason: d.reason,
      mode: d.mode ?? 'Virtual',
    }));
  } catch {
    return [];
  }
};

/** List bookings for a specific student */
export const getBookingsByStudent = async (studentId: string): Promise<BookingDoc[]> => {
  try {
    const res = await databases.listDocuments(DATABASE_ID, BOOKINGS_COLLECTION_ID, [
      Query.equal('studentId', studentId),
      Query.orderDesc('date'),
      Query.limit(50),
    ]);
    return res.documents.map((d: any) => ({
      $id: d.$id,
      counselorId: d.counselorId,
      studentId: d.studentId,
      date: d.date,
      time: d.time,
      status: d.status,
      reason: d.reason,
      mode: d.mode ?? 'Virtual',
    }));
  } catch {
    return [];
  }
};

/** Create a new booking */
export const createBooking = async (data: {
  counselorId: string;
  studentId: string;
  date: string;
  time: string;
  reason: string;
  mode?: string;
}): Promise<BookingDoc> => {
  const doc = await databases.createDocument(
    DATABASE_ID,
    BOOKINGS_COLLECTION_ID,
    ID.unique(),
    {
      counselorId: data.counselorId,
      studentId: data.studentId,
      date: data.date,
      time: data.time,
      status: 'upcoming',
      reason: data.reason,
      mode: data.mode ?? 'Virtual',
    }
  );
  return doc as any;
};

/** Update booking status (complete / cancel) */
export const updateBookingStatus = async (
  documentId: string,
  status: 'completed' | 'cancelled'
): Promise<void> => {
  await databases.updateDocument(DATABASE_ID, BOOKINGS_COLLECTION_ID, documentId, { status });
};

/**
 * Save a clinical health screener result to Appwrite.
 */
export const saveScreenerResult = async (data: {
  studentId: string;
  totalScore: number;
  riskLevel: string;
  answers: number[];
}) => {
  const document = await databases.createDocument(
    DATABASE_ID,
    SCREENER_RESULTS_COLLECTION_ID,
    ID.unique(),
    {
      studentId: data.studentId,
      totalScore: data.totalScore,
      riskLevel: data.riskLevel,
      answers: JSON.stringify(data.answers),
      date: new Date().toISOString(),
    }
  );
  return document;
};

// ── Kuppi Materials Helpers ───────────────────────────────────

export interface KuppiMaterialDoc {
  $id?: string;
  tutorId: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  description: string;
  fileUrl?: string;
  meetingLink?: string;
  createdAt: string;
}

/** Create a new kuppi material */
export const createKuppiMaterial = async (data: {
  tutorId: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  description: string;
  fileUrl?: string;
  meetingLink?: string;
}): Promise<KuppiMaterialDoc> => {
  const doc = await databases.createDocument(
    DATABASE_ID,
    KUPPI_MATERIALS_COLLECTION_ID,
    ID.unique(),
    {
      tutorId: data.tutorId,
      moduleId: data.moduleId,
      moduleTitle: data.moduleTitle,
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl || '',
      meetingLink: data.meetingLink || '',
      createdAt: new Date().toISOString(),
    }
  );
  return doc as any;
};

/** Get all kuppi materials for a specific module */
export const getKuppiMaterialsByModule = async (moduleId: string): Promise<KuppiMaterialDoc[]> => {
  try {
    const res = await databases.listDocuments(DATABASE_ID, KUPPI_MATERIALS_COLLECTION_ID, [
      Query.equal('moduleId', moduleId),
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents as unknown as KuppiMaterialDoc[];
  } catch {
    return [];
  }
};

/** Get all kuppi materials by a tutor */
export const getKuppiMaterialsByTutor = async (tutorId: string): Promise<KuppiMaterialDoc[]> => {
  try {
    const res = await databases.listDocuments(DATABASE_ID, KUPPI_MATERIALS_COLLECTION_ID, [
      Query.equal('tutorId', tutorId),
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents as unknown as KuppiMaterialDoc[];
  } catch {
    return [];
  }
};

/** Get all kuppi materials (for student dashboard) */
export const getAllKuppiMaterials = async (): Promise<KuppiMaterialDoc[]> => {
  try {
    const res = await databases.listDocuments(DATABASE_ID, KUPPI_MATERIALS_COLLECTION_ID, [
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ]);
    return res.documents as unknown as KuppiMaterialDoc[];
  } catch {
    return [];
  }
};

/** Update a kuppi material */
export const updateKuppiMaterial = async (
  documentId: string,
  data: Partial<{
    title: string;
    description: string;
    fileUrl: string;
    meetingLink: string;
  }>
): Promise<void> => {
  await databases.updateDocument(DATABASE_ID, KUPPI_MATERIALS_COLLECTION_ID, documentId, data);
};

/** Delete a kuppi material */
export const deleteKuppiMaterial = async (documentId: string): Promise<void> => {
  await databases.deleteDocument(DATABASE_ID, KUPPI_MATERIALS_COLLECTION_ID, documentId);
};

export { client };
