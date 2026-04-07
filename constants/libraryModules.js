/**
 * Library module catalog — shared by browse (students) and tutor upload picker.
 * Banner gradients inlined here so web bundlers never hit a missing `KUPPI_LIBRARY_BANNERS` reference.
 */
const LIB_MODULE_BANNERS = [
  ['#3FA3F4', '#1E88E5', '#1976D2'],
  ['#F3CF79', '#EDC15C', '#E2AE3E'],
  ['#86D9DB', '#73CDD1', '#5FBDC4'],
  ['#2F96EA', '#1D7FD9', '#1668C2'],
  ['#F1CA72', '#E8BB52', '#DCA134'],
  ['#7ED2D5', '#68C5CA', '#55B5BC'],
];

/**
 * Each item: { id, title, subtitle, progress, banner }
 */
export const LIBRARY_BROWSE_MODULES = [
  {
    id: '1',
    title: 'Professional skills',
    subtitle: 'Communication & workplace readiness',
    progress: 0,
    banner: LIB_MODULE_BANNERS[0],
  },
  {
    id: '2',
    title: 'Probability & Statistics',
    subtitle: 'Mathematics for computing',
    progress: 0,
    banner: LIB_MODULE_BANNERS[1],
  },
  {
    id: '3',
    title: 'Database system',
    subtitle: 'Data modelling & SQL',
    progress: 0,
    banner: LIB_MODULE_BANNERS[2],
  },
  {
    id: '4',
    title: 'Software processing',
    subtitle: 'Processes & lifecycle',
    progress: 0,
    banner: LIB_MODULE_BANNERS[3],
  },
  {
    id: '5',
    title: 'Network Design and Management',
    subtitle: 'Infrastructure & protocols',
    progress: 0,
    banner: LIB_MODULE_BANNERS[4],
  },
  {
    id: '6',
    title: 'Programming Applications',
    subtitle: 'Applied development',
    progress: 0,
    banner: LIB_MODULE_BANNERS[5],
  },
];

export const LIBRARY_FILTER_DROPDOWN_VALUES = ['All', ...LIBRARY_BROWSE_MODULES.map((m) => m.title)];
