/**
 * Timed quiz modules — keep ids aligned with Library `DUMMY_MODULES` for consistency.
 */

export const TIMED_QUIZ_MODULES = [
  {
    id: '1',
    title: 'Professional skills',
    subtitle: 'Communication & workplace readiness',
    bannerIndex: 0,
  },
  {
    id: '2',
    title: 'Probability & Statistics',
    subtitle: 'Mathematics for computing',
    bannerIndex: 1,
  },
  {
    id: '3',
    title: 'Database system',
    subtitle: 'Data modelling & SQL',
    bannerIndex: 2,
  },
  {
    id: '4',
    title: 'Software processing',
    subtitle: 'Processes & lifecycle',
    bannerIndex: 3,
  },
  {
    id: '5',
    title: 'Network Design and Management',
    subtitle: 'Infrastructure & protocols',
    bannerIndex: 4,
  },
  {
    id: '6',
    title: 'Programming Applications',
    subtitle: 'Applied development',
    bannerIndex: 5,
  },
];

/** @type {Record<string, { q: string, options: string[], correct: number }[]>} */
const QUESTIONS_BY_MODULE = {
  '1': [
    {
      q: 'Which is most important for a professional email subject line?',
      options: ['Clear topic & action', 'All caps for urgency', 'No subject', 'Only emojis'],
      correct: 0,
    },
    {
      q: 'Active listening primarily means:',
      options: ['Planning your reply while they talk', 'Repeating everything verbatim', 'Focus & confirm understanding', 'Avoiding eye contact'],
      correct: 2,
    },
    {
      q: 'A concise CV should typically be:',
      options: ['5+ pages', '1–2 pages for early career', 'Only hobbies', 'Unformatted plain text only'],
      correct: 1,
    },
    {
      q: 'Professional feedback is best when it is:',
      options: ['Vague to stay polite', 'Specific, timely, actionable', 'Only negative', 'Sent only once a year'],
      correct: 1,
    },
    {
      q: 'Team conflict resolution often starts with:',
      options: ['Ignoring the issue', 'Private, calm conversation', 'Public blame', 'Escalating immediately'],
      correct: 1,
    },
  ],
  '2': [
    {
      q: 'Probability of an impossible event is:',
      options: ['1', '0', '0.5', 'Undefined always'],
      correct: 1,
    },
    {
      q: 'Mean of a data set is the same as:',
      options: ['Median', 'Average', 'Mode', 'Range'],
      correct: 1,
    },
    {
      q: 'A normal distribution is often drawn as:',
      options: ['Flat line', 'Bell curve', 'Step function', 'Exponential only'],
      correct: 1,
    },
    {
      q: 'Standard deviation measures:',
      options: ['Central value only', 'Spread around the mean', 'Largest value', 'Count of samples'],
      correct: 1,
    },
    {
      q: 'Independent events: P(A and B) equals:',
      options: ['P(A) + P(B)', 'P(A) × P(B)', 'Always 1', 'P(A) − P(B)'],
      correct: 1,
    },
  ],
  '3': [
    {
      q: 'A primary key in a relational table must be:',
      options: ['Duplicate across rows', 'Unique per row', 'Always composite', 'Optional'],
      correct: 1,
    },
    {
      q: 'SQL keyword to retrieve rows:',
      options: ['INSERT', 'SELECT', 'DROP', 'ALTER'],
      correct: 1,
    },
    {
      q: 'A foreign key references:',
      options: ['A file path', 'A primary key in another table', 'Only indexes', 'Temporary data'],
      correct: 1,
    },
    {
      q: 'Normalization mainly reduces:',
      options: ['Speed always', 'Redundancy & anomalies', 'Security', 'Backup size only'],
      correct: 1,
    },
    {
      q: 'ACID properties are associated with:',
      options: ['UI design', 'Transactions', 'Networking', 'Graphics'],
      correct: 1,
    },
  ],
  '4': [
    {
      q: 'Waterfall model phases run mostly:',
      options: ['In random order', 'Sequentially', 'Only one day', 'Without documentation'],
      correct: 1,
    },
    {
      q: 'Agile emphasizes:',
      options: ['Fixed scope forever', 'Iterations & customer feedback', 'No testing', 'Single release only'],
      correct: 1,
    },
    {
      q: 'A sprint in Scrum is a:',
      options: ['Year-long phase', 'Time-boxed iteration', 'Budget line', 'Bug database'],
      correct: 1,
    },
    {
      q: 'Requirements should ideally be:',
      options: ['Vague', 'Testable & clear', 'Only verbal', 'Hidden from developers'],
      correct: 1,
    },
    {
      q: 'Version control helps teams:',
      options: ['Avoid collaboration', 'Track changes & merge work', 'Delete history', 'Compile faster'],
      correct: 1,
    },
  ],
  '5': [
    {
      q: 'IP address at network layer (TCP/IP) is handled by:',
      options: ['HTTP', 'IP', 'SMTP', 'FTP only'],
      correct: 1,
    },
    {
      q: 'DNS translates:',
      options: ['MAC to IP', 'Domain names to IP addresses', 'Ports to URLs', 'Wi‑Fi passwords'],
      correct: 1,
    },
    {
      q: 'A subnet mask is used to:',
      options: ['Encrypt packets', 'Divide network/host portions of an IP', 'Replace routers', 'Boost Wi‑Fi range only'],
      correct: 1,
    },
    {
      q: 'TCP is best described as:',
      options: ['Connectionless only', 'Connection-oriented, reliable', 'Always fastest for video', 'Layer 1 only'],
      correct: 1,
    },
    {
      q: 'Default gateway typically:',
      options: ['Stores RAM', 'Routes traffic to other networks', 'Is always 127.0.0.1', 'Replaces DNS'],
      correct: 1,
    },
  ],
  '6': [
    {
      q: 'Which is a compiled language example?',
      options: ['HTML', 'C', 'Markdown', 'SQL only'],
      correct: 1,
    },
    {
      q: 'A function should ideally:',
      options: ['Do everything in one block', 'Have a single clear purpose', 'Never return values', 'Avoid parameters'],
      correct: 1,
    },
    {
      q: 'Unit tests mainly verify:',
      options: ['Marketing copy', 'Small pieces of code in isolation', 'Hardware fans', 'DNS speed'],
      correct: 1,
    },
    {
      q: 'Git “commit” records:',
      options: ['A screenshot', 'A snapshot of staged changes', 'Only binary files', 'Nothing useful'],
      correct: 1,
    },
    {
      q: 'REST APIs often use HTTP methods:',
      options: ['COPY / PASTE', 'GET / POST / PUT / DELETE', 'PING / PONG', 'ZIP / UNZIP'],
      correct: 1,
    },
  ],
  default: [
    {
      q: 'What does “CPU” stand for?',
      options: ['Central Processing Unit', 'Computer Personal Unit', 'Core Program Utility', 'Cached Process User'],
      correct: 0,
    },
    {
      q: 'Which structure is FIFO?',
      options: ['Stack', 'Queue', 'Binary tree', 'Hash map'],
      correct: 1,
    },
    {
      q: 'HTTP 404 means:',
      options: ['Server error', 'Unauthorized', 'Not found', 'Created'],
      correct: 2,
    },
    {
      q: 'Big-O of binary search on sorted array?',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      correct: 1,
    },
    {
      q: 'Primary key must be:',
      options: ['Nullable', 'Unique per row', 'Always a string', 'Encrypted'],
      correct: 1,
    },
  ],
};

/**
 * @param {string} moduleId
 * @returns {{ q: string, options: string[], correct: number }[]}
 */
export function getQuizQuestionsForModule(moduleId) {
  const list = QUESTIONS_BY_MODULE[moduleId];
  if (list?.length) return list;
  return QUESTIONS_BY_MODULE.default;
}

export function getTimedQuizModule(moduleId) {
  return TIMED_QUIZ_MODULES.find((m) => m.id === moduleId) || null;
}
