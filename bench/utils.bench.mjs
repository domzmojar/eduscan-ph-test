import { bench, describe } from 'vitest';
import {
  escapeHTML,
  sameDay,
  formatDate,
  getLogMonth,
  phLocalToISOString,
  buildStudentName,
  deriveSyncSecret,
  logMergeKey,
  computeTermsFromStartDate,
  defaultTermsForYear,
} from '../src/eduscan-utils.mjs';

// Representative inputs roughly matching a busy classroom dataset.
const NAMES = Array.from({ length: 500 }, (_, i) => ({
  last: `Dela Cruz ${i}`,
  first: `Juan <${i}>`,
  middle: i % 3 === 0 ? `Santos & "${i}"` : '',
}));

const LOGS = Array.from({ length: 1000 }, (_, i) => ({
  timestamp: new Date(Date.UTC(2025, 5, 1 + (i % 28), 1, i % 60)).toISOString(),
  localDate: i % 2 === 0 ? `2025-06-${String((i % 28) + 1).padStart(2, '0')}` : undefined,
  studentLrn: `1360${String(i).padStart(8, '0')}`,
  studentName: NAMES[i % NAMES.length].last,
  type: i % 5 === 0 ? 'departure' : 'arrival',
}));

const SYNC_URL = 'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit#gid=0';

describe('html escaping', () => {
  bench('escapeHTML over student name set', () => {
    for (const n of NAMES) {
      escapeHTML(n.last);
      escapeHTML(n.first);
      escapeHTML(n.middle);
    }
  });
});

describe('name formatting', () => {
  bench('buildStudentName (SF2 format)', () => {
    for (const n of NAMES) {
      buildStudentName(n.last, n.first, n.middle);
    }
  });
});

describe('date helpers', () => {
  bench('sameDay across log set', () => {
    for (const l of LOGS) {
      sameDay(l.timestamp, '2025-06-15');
    }
  });

  bench('getLogMonth across log set', () => {
    for (const l of LOGS) {
      getLogMonth(l);
    }
  });

  bench('formatDate', () => {
    for (let d = 1; d <= 28; d++) {
      formatDate(`2025-06-${String(d).padStart(2, '0')}`);
    }
  });

  bench('phLocalToISOString', () => {
    for (const l of LOGS) {
      phLocalToISOString(2025, 6, (l.timestamp.length % 28) + 1, 8, 30);
    }
  });
});

describe('sync helpers', () => {
  bench('deriveSyncSecret', () => {
    for (let i = 0; i < LOGS.length; i++) {
      deriveSyncSecret(SYNC_URL + i);
    }
  });

  bench('logMergeKey across log set', () => {
    for (const l of LOGS) {
      logMergeKey(l);
    }
  });
});

describe('term calendar', () => {
  bench('computeTermsFromStartDate', () => {
    for (let m = 1; m <= 12; m++) {
      computeTermsFromStartDate(`2025-${String(m).padStart(2, '0')}-01`);
    }
  });

  bench('defaultTermsForYear', () => {
    for (let y = 2015; y <= 2035; y++) {
      defaultTermsForYear(y);
    }
  });
});
