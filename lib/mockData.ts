export interface StudentProfile {
  id: string;
  studentNumber: string;
  name: string;
  major: string;
  sharingEnabled: boolean;
  avatar: string;
}

export interface MoodLog {
  id: string;
  studentId: string;
  date: string;
  moodLevel: number;
  factors: string[];
  journal: string | null;
}

export interface Counselor {
  id: string;
  name: string;
  specialty: string;
  availability: string[];
  avatar: string;
}

export interface Booking {
  id: string;
  counselorId: string;
  studentId: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  reason: string;
  mode?: 'Virtual' | 'In-Person';
}

export interface RecoveryTask {
  id: string;
  studentId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  type: 'academic' | 'wellbeing' | 'admin';
}

export interface TriggerEvent {
  id: string;
  studentId: string;
  icon: string;
  title: string;
  tag: string;
  date: string;
  body: string;
}

export interface WellbeingInsights {
  weeklyAverage: number;
  moodDistribution: { label: string; percentage: number; color: string }[];
  streakDays: number;
  score: number;
  monthlyAverages: { month: string; value: number }[];
}

// --- DATA GENERATION ---

const generateProfiles = (): StudentProfile[] => {
  const names = [
    'Emma Watson', 'James Chen', 'Aisha Khan', "Liam O'Connor",
    'Sophia Patel', 'Noah Davis', 'Mia Taylor', 'Ethan Wright',
    'Isabella Lopez', 'Inothma Gunawardhana'
  ];
  return names.map((name, i) => ({
    id: i === 9 ? 'student123' : `student_${i + 1}`,
    studentNumber: `IT22${1000 + i}`,
    name,
    major: i % 2 === 0 ? 'Computer Science' : 'Software Engineering',
    sharingEnabled: i % 3 !== 0,
    avatar: '👨‍🎓'
  }));
};

const generateMoodLogs = (students: StudentProfile[]): MoodLog[] => {
  const logs: MoodLog[] = [];
  const factorsList = ['Academic Stress', 'Sleep Deprivation', 'Financial', 'Social', 'Health'];
  const now = new Date();

  students.forEach(student => {
    if (student.id === 'student123') return; // handled separately
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const rand = Math.random();
      const level = Math.floor(rand * 5) + 1;
      logs.push({
        id: `m_${student.id}_${i}`,
        studentId: student.id,
        date: date.toISOString(),
        moodLevel: level,
        factors: [factorsList[Math.floor(Math.random() * factorsList.length)]],
        journal: rand > 0.7 ? `Feeling a bit ${level > 3 ? 'better' : 'overwhelmed'} today.` : null
      });
    }
  });

  // GUARANTEED triggers for student123
  const guaranteedLogs: MoodLog[] = [
    { id: 'm_student123_g0', studentId: 'student123', date: new Date(now.getTime() - 0 * 86400000).toISOString(), moodLevel: 1, factors: ['Academic Stress'], journal: 'Stressed about the 80% presentation.' },
    { id: 'm_student123_g1', studentId: 'student123', date: new Date(now.getTime() - 1 * 86400000).toISOString(), moodLevel: 2, factors: ['Sleep Deprivation'], journal: 'Slept only 3 hours.' },
    { id: 'm_student123_g2', studentId: 'student123', date: new Date(now.getTime() - 2 * 86400000).toISOString(), moodLevel: 1, factors: ['Academic Stress', 'Sleep Deprivation'], journal: 'Overwhelmed with deadlines.' },
    { id: 'm_student123_g3', studentId: 'student123', date: new Date(now.getTime() - 3 * 86400000).toISOString(), moodLevel: 2, factors: ['Financial'], journal: 'Worried about finances.' },
    { id: 'm_student123_g4', studentId: 'student123', date: new Date(now.getTime() - 4 * 86400000).toISOString(), moodLevel: 1, factors: ['Sleep Deprivation'], journal: 'Exhausted.' },
    { id: 'm_student123_g5', studentId: 'student123', date: new Date(now.getTime() - 5 * 86400000).toISOString(), moodLevel: 3, factors: ['Social'], journal: 'A bit better today.' },
    { id: 'm_student123_g6', studentId: 'student123', date: new Date(now.getTime() - 6 * 86400000).toISOString(), moodLevel: 2, factors: ['Academic Stress'], journal: 'Assignment overdue.' },
    { id: 'm_student123_g7', studentId: 'student123', date: new Date(now.getTime() - 7 * 86400000).toISOString(), moodLevel: 1, factors: ['Academic Stress'], journal: 'Very stressed.' },
    { id: 'm_student123_g8', studentId: 'student123', date: new Date(now.getTime() - 8 * 86400000).toISOString(), moodLevel: 2, factors: ['Sleep Deprivation', 'Social'], journal: 'Isolated and tired.' },
    { id: 'm_student123_g9', studentId: 'student123', date: new Date(now.getTime() - 9 * 86400000).toISOString(), moodLevel: 1, factors: ['Academic Stress'], journal: 'Failed a quiz today.' },
    { id: 'm_student123_g10', studentId: 'student123', date: new Date(now.getTime() - 10 * 86400000).toISOString(), moodLevel: 2, factors: ['Financial', 'Academic Stress'], journal: 'Too much going on.' },
    { id: 'm_student123_g11', studentId: 'student123', date: new Date(now.getTime() - 11 * 86400000).toISOString(), moodLevel: 3, factors: ['Social'], journal: 'Had lunch with friends.' },
    { id: 'm_student123_g12', studentId: 'student123', date: new Date(now.getTime() - 12 * 86400000).toISOString(), moodLevel: 1, factors: ['Sleep Deprivation'], journal: 'Barely slept.' },
    { id: 'm_student123_g13', studentId: 'student123', date: new Date(now.getTime() - 13 * 86400000).toISOString(), moodLevel: 2, factors: ['Academic Stress'], journal: 'Presentation prep is stressful.' },
  ];

  return [...logs, ...guaranteedLogs];
};

export const counselors: Counselor[] = [
  { id: 'c1', name: 'Dr. Sarah Jennings', specialty: 'Academic Stress', availability: ['10:00 AM', '1:00 PM', '3:00 PM'], avatar: '👩‍⚕️' },
  { id: 'c2', name: 'Mr. David Cho', specialty: 'Career Anxiety', availability: ['9:00 AM', '11:30 AM'], avatar: '👨‍💼' },
  { id: 'c3', name: 'Dr. Emily Chen', specialty: 'General Wellbeing', availability: ['2:00 PM', '4:00 PM'], avatar: '🩺' }
];

const generateBookings = (students: StudentProfile[]): Booking[] => {
  return [
    { id: 'b1', counselorId: 'c1', studentId: students[0].id, date: '2026-04-10', time: '10:00 AM', status: 'upcoming', reason: 'Exam anxiety', mode: 'Virtual' },
    { id: 'b2', counselorId: 'c2', studentId: students[1].id, date: '2026-04-11', time: '11:30 AM', status: 'upcoming', reason: 'Career paths', mode: 'In-Person' },
    { id: 'b3', counselorId: 'c1', studentId: students[2].id, date: '2026-03-25', time: '1:00 PM', status: 'completed', reason: 'General check-in', mode: 'Virtual' },
    { id: 'b4', counselorId: 'c3', studentId: 'student123', date: '2026-04-12', time: '2:00 PM', status: 'upcoming', reason: 'Stress management', mode: 'Virtual' },
    { id: 'b5', counselorId: 'c1', studentId: students[3].id, date: '2026-04-15', time: '3:00 PM', status: 'cancelled', reason: 'Time conflict', mode: 'In-Person' },
    { id: 'b6', counselorId: 'c2', studentId: students[4].id, date: '2026-03-10', time: '9:00 AM', status: 'completed', reason: 'Graduation panic', mode: 'Virtual' },
    { id: 'b7', counselorId: 'c3', studentId: students[5].id, date: '2026-04-14', time: '4:00 PM', status: 'upcoming', reason: 'Focus issues', mode: 'In-Person' },
    { id: 'b8', counselorId: 'c1', studentId: students[6].id, date: '2026-04-16', time: '10:00 AM', status: 'upcoming', reason: 'Workload', mode: 'Virtual' },
    // Guaranteed cancelled booking for student123 to trigger Rule 3
    { id: 'b9', counselorId: 'c1', studentId: 'student123', date: '2026-03-20', time: '10:00 AM', status: 'cancelled', reason: 'Could not attend', mode: 'Virtual' },
    { id: 'b10', counselorId: 'c2', studentId: 'student123', date: '2026-03-15', time: '9:00 AM', status: 'completed', reason: 'Initial check-in', mode: 'Virtual' },
  ];
};

// --- IN MEMORY DB STATE ---
let studentProfiles = generateProfiles();
let moodLogs = generateMoodLogs(studentProfiles);
let bookings = generateBookings(studentProfiles);
let triggerEvents: TriggerEvent[] = [];
let recoveryTasks: RecoveryTask[] = [];

const CURRENT_USER_ID = 'student123';

// --- RULES ENGINE ---
const evaluateRulesEngine = (studentId: string) => {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentLogs = moodLogs
    .filter(m => m.studentId === studentId && new Date(m.date) >= fourteenDaysAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentBookings = bookings.filter(
    b => b.studentId === studentId && new Date(b.date) < now
  );

  const addTriggerAndTask = (trigger: TriggerEvent, task: RecoveryTask) => {
    if (!triggerEvents.some(t => t.studentId === studentId && t.tag === trigger.tag)) {
      triggerEvents.push(trigger);
    }
    if (!recoveryTasks.some(t => t.studentId === studentId && t.id === task.id)) {
      recoveryTasks.push(task);
    }
  };

  // Rule 1: 3 consecutive low moods
  let consecutiveLow = 0;
  for (const log of recentLogs) {
    if (log.moodLevel <= 2) consecutiveLow++;
    else consecutiveLow = 0;
    if (consecutiveLow >= 3) {
      addTriggerAndTask(
        { id: `trig_mood_${studentId}`, studentId, icon: '📉', title: 'Consecutive Low Moods Detected', tag: 'Mood Pattern', date: log.date.split('T')[0], body: 'System detected 3 or more consecutive days of low mood (level 2 or below). Immediate support is recommended.' },
        { id: `task_mood_${studentId}`, studentId, title: 'Schedule a Wellbeing Check-in', description: 'Your mood has been consistently low. Book a brief check-in session with a counselor this week.', isCompleted: false, type: 'wellbeing' }
      );
      break;
    }
  }

  // Rule 2a: Academic Stress factor
  const recentFactors = recentLogs.flatMap(m => m.factors);
  if (recentFactors.includes('Academic Stress')) {
    addTriggerAndTask(
      { id: `trig_acad_${studentId}`, studentId, icon: '📚', title: 'High Academic Stress', tag: 'Factor Detection', date: now.toISOString().split('T')[0], body: 'Academic stress was frequently cited across multiple recent mood check-ins.' },
      { id: `task_acad_${studentId}`, studentId, title: 'Review & Break Down Upcoming Deadlines', description: 'List all upcoming deadlines and break each into 3 smaller tasks. Speak to your module coordinator if you need an extension.', isCompleted: false, type: 'academic' }
    );
    // Extra academic task
    addTriggerAndTask(
      { id: `trig_acad2_${studentId}`, studentId, icon: '🎓', title: 'Academic Performance Risk', tag: 'Academic', date: now.toISOString().split('T')[0], body: 'Sustained academic stress increases risk of performance decline.' },
      { id: `task_acad2_${studentId}`, studentId, title: 'Meet with Academic Advisor', description: 'Schedule a 15-minute meeting with your academic advisor to discuss workload management and available support.', isCompleted: false, type: 'academic' }
    );
  }

  // Rule 2b: Sleep Deprivation factor
  if (recentFactors.includes('Sleep Deprivation')) {
    addTriggerAndTask(
      { id: `trig_sleep_${studentId}`, studentId, icon: '💤', title: 'Chronic Sleep Disruptions', tag: 'Factor Detection', date: now.toISOString().split('T')[0], body: 'Sleep deprivation was tracked across multiple recent check-ins. Poor sleep significantly impacts mental health.' },
      { id: `task_sleep_${studentId}`, studentId, title: 'Start a Sleep Hygiene Routine', description: 'Set a consistent bedtime for the next 7 days. Avoid screens 1 hour before bed and limit caffeine after 3PM.', isCompleted: false, type: 'wellbeing' }
    );
  }

  // Rule 2c: Social isolation
  const socialCount = recentLogs.filter(l => l.factors.includes('Social')).length;
  if (socialCount >= 2) {
    addTriggerAndTask(
      { id: `trig_social_${studentId}`, studentId, icon: '👥', title: 'Social Isolation Pattern', tag: 'Factor Detection', date: now.toISOString().split('T')[0], body: 'Social factors have been flagged across multiple check-ins indicating possible isolation.' },
      { id: `task_social_${studentId}`, studentId, title: 'Reconnect with Your Support Network', description: 'Reach out to a friend, family member or peer today. Even a brief conversation can significantly boost mood.', isCompleted: false, type: 'wellbeing' }
    );
  }

  // Rule 3: Missed/cancelled counseling sessions
  const missedSessions = recentBookings.filter(b => b.status === 'cancelled');
  if (missedSessions.length > 0) {
    addTriggerAndTask(
      { id: `trig_missed_${studentId}`, studentId, icon: '⚠️', title: 'Missed Counseling Session', tag: 'Attendance', date: missedSessions[0].date, body: `You have ${missedSessions.length} cancelled counseling session(s). Consistent sessions are key to recovery.` },
      { id: `task_missed_${studentId}`, studentId, title: 'Reschedule Your Counseling Session', description: 'Please reschedule your cancelled session as soon as possible. Regular counseling is an important part of your recovery plan.', isCompleted: false, type: 'admin' }
    );
  }

  // Rule 4: Wellbeing score dropping
  const avgMood = recentLogs.length > 0
    ? recentLogs.reduce((acc, l) => acc + l.moodLevel, 0) / recentLogs.length
    : 0;
  if (recentLogs.length > 0 && avgMood < 2.5) {
    addTriggerAndTask(
      { id: `trig_score_${studentId}`, studentId, icon: '📊', title: 'Wellbeing Score Below Baseline', tag: 'Insights', date: now.toISOString().split('T')[0], body: `Your average mood score is ${avgMood.toFixed(1)}/5 over the last 14 days — well below the healthy baseline of 3.5.` },
      { id: `task_score_${studentId}`, studentId, title: 'Daily Gratitude Journaling', description: 'Write down 3 things you are grateful for each morning this week. Research shows this significantly improves baseline mood over time.', isCompleted: false, type: 'wellbeing' }
    );
    // Extra task for low score
    addTriggerAndTask(
      { id: `trig_score2_${studentId}`, studentId, icon: '🧘', title: 'Stress Management Needed', tag: 'Insights', date: now.toISOString().split('T')[0], body: 'Sustained low mood requires active stress management strategies.' },
      { id: `task_score2_${studentId}`, studentId, title: 'Practice Daily Mindfulness', description: 'Spend 10 minutes each day on a mindfulness or breathing exercise. Apps like Headspace or Calm can guide you through this.', isCompleted: false, type: 'wellbeing' }
    );
  }

  // Rule 5: Days without logging
  const sortedLogs = recentLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const msSinceLastLog = sortedLogs.length > 0
    ? now.getTime() - new Date(sortedLogs[0].date).getTime()
    : now.getTime() - fourteenDaysAgo.getTime();
  const daysSinceLastLog = msSinceLastLog / (1000 * 60 * 60 * 24);
  if (daysSinceLastLog >= 3) {
    addTriggerAndTask(
      { id: `trig_nolog_${studentId}`, studentId, icon: '📱', title: 'Mood Logging Gap Detected', tag: 'Engagement', date: now.toISOString().split('T')[0], body: `No mood logs recorded in the last ${Math.floor(daysSinceLastLog)} days. Consistent logging helps the system support you better.` },
      { id: `task_nolog_${studentId}`, studentId, title: 'Resume Daily Mood Logging', description: 'Take 30 seconds right now to log your current mood and any contributing factors. Daily logging is the foundation of your recovery tracking.', isCompleted: false, type: 'admin' }
    );
  }
};

// --- APPWRITE API MOCK FUNCTIONS ---

export const getStudentProfile = async (studentId: string): Promise<StudentProfile | null> => {
  return new Promise(resolve => setTimeout(() => resolve(studentProfiles.find(s => s.id === studentId) || null), 200));
};

export const getAllStudents = async (): Promise<StudentProfile[]> => {
  return new Promise(resolve => setTimeout(() => resolve([...studentProfiles]), 300));
};

export const getMoodLogs = async (studentId?: string): Promise<MoodLog[]> => {
  return new Promise(resolve => setTimeout(() => {
    const logs = studentId ? moodLogs.filter(m => m.studentId === studentId) : [...moodLogs];
    resolve(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, 400));
};

export const saveMoodLog = async (log: Omit<MoodLog, 'id' | 'date' | 'studentId'>): Promise<MoodLog> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newLog: MoodLog = {
        ...log,
        id: Math.random().toString(36).substring(7),
        studentId: CURRENT_USER_ID,
        date: new Date().toISOString()
      };
      moodLogs.unshift(newLog);
      resolve(newLog);
    }, 600);
  });
};

export const getBookings = async (studentId: string = CURRENT_USER_ID): Promise<Booking[]> => {
  return new Promise(resolve => setTimeout(() => resolve(bookings.filter(b => b.studentId === studentId)), 500));
};

export const getBookingsByCounselor = async (counselorId: string): Promise<Booking[]> => {
  return new Promise(resolve => setTimeout(() => resolve(bookings.filter(b => b.counselorId === counselorId)), 500));
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'status'>): Promise<Booking> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newBooking: Booking = {
        ...booking,
        id: 'b' + Math.random().toString(36).substring(7),
        status: 'upcoming'
      };
      bookings.push(newBooking);
      resolve(newBooking);
    }, 700);
  });
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const index = bookings.findIndex(b => b.id === bookingId);
      if (index !== -1) bookings[index].status = 'cancelled';
      resolve();
    }, 300);
  });
};

export const updateBookingStatus = async (bookingId: string, status: 'completed' | 'cancelled'): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const index = bookings.findIndex(b => b.id === bookingId);
      if (index !== -1) bookings[index].status = status;
      resolve();
    }, 300);
  });
};

export const getCounselors = async (): Promise<Counselor[]> => {
  return new Promise(resolve => setTimeout(() => resolve(counselors), 300));
};

export const getRecoveryPlan = async (studentId: string = CURRENT_USER_ID): Promise<{ tasks: RecoveryTask[], triggers: TriggerEvent[] }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      evaluateRulesEngine(studentId);
      resolve({
        tasks: recoveryTasks.filter(t => t.studentId === studentId),
        triggers: triggerEvents.filter(t => t.studentId === studentId)
      });
    }, 400);
  });
};

export const updateRecoveryTask = async (taskId: string, isCompleted: boolean): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const taskIndex = recoveryTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        recoveryTasks[taskIndex].isCompleted = isCompleted;
      }
      resolve();
    }, 300);
  });
};

export const updateCounselorAvailability = async (counselorId: string, availableTimes: string[]): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const c = counselors.find(c => c.id === counselorId);
      if (c) c.availability = availableTimes;
      resolve();
    }, 300);
  });
};

export const getInsights = async (studentId: string = CURRENT_USER_ID): Promise<WellbeingInsights> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const stdLogs = moodLogs.filter(m => m.studentId === studentId);
      const avgMood = stdLogs.length > 0
        ? stdLogs.reduce((acc, l) => acc + l.moodLevel, 0) / stdLogs.length
        : 3;

      const factorCounts: Record<string, number> = {};
      stdLogs.forEach(l => l.factors.forEach(f => {
        factorCounts[f] = (factorCounts[f] || 0) + 1;
      }));
      const totalFactors = Object.values(factorCounts).reduce((a, b) => a + b, 0);
      const moodDistribution = Object.entries(factorCounts).map(([label, count], i) => ({
        label,
        percentage: Math.round((count / totalFactors) * 100),
        color: ['#FC8181', '#F6E05E', '#68D391', '#76E4F7', '#9F7AEA'][i % 5]
      }));

      // Calculate streak
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const day = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
        if (stdLogs.some(l => l.date.split('T')[0] === day)) streak++;
        else break;
      }

      resolve({
        weeklyAverage: Math.round(avgMood * 20),
        moodDistribution,
        streakDays: streak,
        score: Math.round(avgMood * 20),
        monthlyAverages: [
          { month: 'Oct', value: 6.2 },
          { month: 'Nov', value: 5.5 },
          { month: 'Dec', value: 6.8 },
          { month: 'Jan', value: 5.8 },
          { month: 'Feb', value: 7.1 },
          { month: 'Mar', value: 6.5 },
        ]
      });
    }, 600);
  });
};