/**
 * Shared palette for Library / module resource flows:
 * white + sky-blue mix, soft glass frames, outlines.
 * Reference: cool blue panels (#F0F7FF), borders #D1E3FF, title #0A192F, subtitle #5A6B89.
 */

/** Matches design reference — header / tab “blue” surfaces */
export const LIB_REF = {
  /** Page & panel: light blue-white (not flat white) */
  screenBg: '#EEF6FF',
  panelInner: '#F0F7FF',
  panelOuter: '#E0EBFA',
  /** Thin outline on cards & back chip */
  borderCool: '#D1E3FF',
  titleNavy: '#0A192F',
  subtitleBlueGrey: '#5A6B89',
};

/** Dark blue hero: “All Modules” card + tab strip (light text on navy) */
export const LIB_HEADER_DARK = {
  cardGradient: ['#052642', '#0A3D62', '#0E5282'],
  cardLocations: [0, 0.48, 1],
  tabStripGradient: ['#041A2E', '#062A44', '#083654'],
  tabLocations: [0, 0.52, 1],
  frameBorder: 'rgba(56,189,248,0.5)',
  title: '#F8FAFC',
  subtitle: '#BFDBFE',
  tabLabelInactive: '#94A3B8',
  tabLabelActive: '#7DD3FC',
  tabIconInactive: '#94A3B8',
  tabIconActive: '#38BDF8',
  backFill: 'rgba(5, 38, 64, 0.9)',
  backBorder: 'rgba(125,211,252,0.5)',
  backIcon: '#E0F2FE',
  tabRowDivider: 'rgba(255,255,255,0.12)',
};

export const LIB_BG = {
  /** Top: more blue → soft white at bottom (matches reference gradient) */
  base: ['#E8F1FC', '#F0F7FF', '#F5FAFF', '#FAFCFF', '#E0F2FE', '#DBEAFE'],
  baseLocations: [0, 0.12, 0.28, 0.48, 0.72, 1],
  /** Light airy wash (diagonal) */
  overlay: ['rgba(255,255,255,0.55)', 'rgba(224,242,254,0.25)', 'rgba(147,197,253,0.35)'],
  overlayLocations: [0, 0.45, 1],
  imageOpacity: 0.06,
  /** Final veil: ties scroll area to screenBg #EEF6FF */
  veil: ['rgba(238,246,255,0.65)', 'rgba(240,247,255,0.25)', 'rgba(209,227,255,0.45)'],
  veilLocations: [0, 0.5, 1],
};

export const LIB_FRAME = {
  /** Frosted panel on light blue */
  glass: {
    backgroundColor: 'rgba(240,247,255,0.92)',
    borderWidth: 1,
    borderColor: LIB_REF.borderCool,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  /** Inner hairline (double-frame look) */
  glassInner: {
    borderWidth: 1,
    borderColor: LIB_REF.borderCool,
  },
  /** Section rail — tab strip */
  section: {
    backgroundColor: LIB_REF.panelInner,
    borderWidth: 1,
    borderColor: LIB_REF.borderCool,
    borderRadius: 14,
  },
  title: LIB_REF.titleNavy,
  titleAccent: '#0EA5E9',
  body: LIB_REF.subtitleBlueGrey,
  muted: '#64748B',
  tabInactive: '#5A6B89',
  cardFace: '#FFFFFF',
  cardBorder: 'rgba(125,211,252,0.7)',
  cardShadow: 'rgba(15,23,42,0.08)',
  outlineStrong: 'rgba(59,130,246,0.38)',
};
