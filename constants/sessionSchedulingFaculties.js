/**
 * Session scheduling: faculty → module ids (aligned with TIMED_QUIZ_MODULES in timedQuizContent).
 */

/** Create flow skips the faculty grid; modules screen lists every faculty’s modules using this id. */
export const SESSION_SCHEDULING_CREATE_ALL_ID = 'create-all';

/**
 * Route params for “Create session scheduling” → module list (no faculty picker).
 */
export const sessionSchedulingCreateModulesParams = {
  intent: 'create',
  facultyId: SESSION_SCHEDULING_CREATE_ALL_ID,
  facultyTitle: encodeURIComponent('Create session scheduling'),
};

/** Student “Session scheduling” skips the faculty grid; same combined module list as create, without intent=create. */
export const SESSION_SCHEDULING_BROWSE_ALL_ID = 'browse-all';

export const sessionSchedulingBrowseModulesParams = {
  facultyId: SESSION_SCHEDULING_BROWSE_ALL_ID,
  facultyTitle: encodeURIComponent('Session scheduling'),
};

export const SESSION_SCHEDULING_FACULTIES = [
  {
    id: 'computing',
    title: 'Faculty of Computing',
    color: '#38BDF8',
    icon: 'laptop-outline',
    useGoldLabel: false,
  },
  {
    id: 'business',
    title: 'SLIIT Business School',
    color: '#FB923C',
    icon: 'briefcase-outline',
    useGoldLabel: true,
    labelColor: '#CA8A04',
  },
  {
    id: 'engineering',
    title: 'Faculty of Engineering',
    color: '#84CC16',
    icon: 'cog-outline',
    useGoldLabel: false,
  },
  {
    id: 'humanities',
    title: 'Faculty of Humanities and Sciences',
    color: '#A855F7',
    icon: 'bulb-outline',
    useGoldLabel: false,
  },
  {
    id: 'architecture',
    title: 'School of Architecture',
    color: '#14B8A6',
    icon: 'cube-outline',
    useGoldLabel: false,
  },
  {
    id: 'graduate',
    title: 'Faculty of Graduate Studies and Research',
    color: '#EAB308',
    icon: 'document-text-outline',
    useGoldLabel: false,
  },
];

/** Module ids (string) per faculty — maps onto TIMED_QUIZ_MODULES */
export const FACULTY_MODULE_IDS = {
  computing: ['3', '5', '6'], // Database, Network, Programming
  business: ['1'], // Professional skills
  engineering: ['4', '5'], // Software processing, Network (infrastructure)
  humanities: ['2'], // Probability & Statistics
  architecture: ['4'], // Processes / studio workflow (shared id for demo)
  graduate: ['1', '2', '3'], // Skills, stats, database literacy for research
};

export function getFacultyById(id) {
  return SESSION_SCHEDULING_FACULTIES.find((f) => f.id === id) || null;
}
