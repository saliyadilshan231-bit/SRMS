/**
 * Peer Tutor registration — light → deep blue mix, pop-up field chrome.
 */

import { KUPPI_BANNER_CYAN, KUPPI_GOLD } from '@/constants/kuppiPalette';

export const PT = {
  accent: '#0EA5E9',
  accentDeep: '#0284C7',
  accentIndigo: '#2563EB',

  /** Vertical page: airy top, richer blue toward bottom */
  pageGradient: ['#F8FAFC', '#E8F4FC', '#D4EAF7', '#A5D8FC', '#5BA3E8', '#1D4E8C', '#0C4A6E'],
  pageLocations: [0, 0.12, 0.28, 0.48, 0.68, 0.88, 1],

  /** Soft diagonal wash */
  wash: ['rgba(255,255,255,0.35)', 'rgba(224,242,254,0.15)', 'rgba(15,23,42,0.08)'],

  /** Section shell (frosted card behind groups) */
  sectionBg: 'rgba(255,255,255,0.88)',
  sectionBorder: 'rgba(125,211,252,0.75)',
  sectionShadow: 'rgba(15,23,42,0.1)',

  /** Pop-up input surface */
  popBg: '#FFFFFF',
  popBorder: 'rgba(147,197,253,0.9)',
  popBorderFocus: '#0EA5E9',
  popShadow: 'rgba(15,58,110,0.18)',
  popRadius: 14,

  label: '#0C4A6E',
  textPrimary: '#0F172A',
  textMuted: '#64748B',

  /** Hero ribbon — same light cyan mix as “Software processing” module card */
  heroBadge: KUPPI_BANNER_CYAN,
  /** Submit — dark navy blue mix */
  submitGrad: ['#0D0D7E', '#0b0b69', '#08085A'],
  submitLocations: [0, 0.5, 1],
  submitShadow: '#050544',
  /** Upload outline / secondary gold accent */
  uploadGold: KUPPI_GOLD,
};
