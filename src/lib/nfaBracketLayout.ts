/**
 * NFA Bracket Layout — Column Definitions
 *
 * Defines the horizontal column layout for each division in the NFA
 * bracket system.  Ported from the reference HTML implementations
 * (bracket-test.html for 3-division, bracket-test4.html for 4-division).
 *
 * The layout follows the NFA PDF style:
 *   Winners (left) -> Finals (center) -> Losers (right, mirrored)
 */

export interface NfaBracketColumn {
  /** Which bracket rounds appear in this column (e.g. ['W1'], ['SF','F','3P']) */
  rounds: string[];
  /** Which bracket sections/sides the rounds belong to (e.g. ['winners'], ['finals']) */
  sections: string[];
  /** Display label for the column header (may contain \n for multi-line) */
  label: string;
  /** CSS header colour class: 'winners' (emerald), 'losers' (orange), 'finals' (amber) */
  headerClass: 'winners' | 'losers' | 'finals';
  /** Optional cascade badge shown below the header */
  divisionTag?: { text: string; cssClass: string };
  /** If true, column uses the DE finals layout: SFs in flow, F+3P centred between them */
  finalsStack?: boolean;
  /** If true, column uses the SE finals layout: F centred, 3P below */
  finalsPair?: boolean;
}

/**
 * Return column definitions for a given division and division count.
 *
 * @param division  'D1' | 'D2' | 'D3' | 'D4'
 * @param divisionCount  3 (D1/D2/D3) or 4 (D1/D2/D3/D4)
 */
export function getColumnDefs(
  division: string,
  divisionCount: 3 | 4,
): NfaBracketColumn[] {
  // ── D1 — same layout for 3-div and 4-div ──────────────────────
  if (division === 'D1') {
    // The only difference between 3-div and 4-div for D1 is the
    // cascade targets on the losers columns:
    //   3-div: L1/L2 -> D3, L3/L4 -> D2
    //   4-div: L1 -> D4, L2 -> D3, L3/L4 -> D2

    const l1Tag =
      divisionCount === 4
        ? { text: '\u2192 DIVISION 4', cssClass: 'd4-tag' }
        : { text: '\u2192 DIVISION 3', cssClass: 'd3-tag' };

    const l2Tag =
      divisionCount === 4
        ? { text: '\u2192 DIVISION 3', cssClass: 'd3-tag' }
        : { text: '\u2192 DIVISION 3', cssClass: 'd3-tag' };

    return [
      // Winners bracket: left to right
      {
        rounds: ['W1'],
        sections: ['winners'],
        label: '1st Round W1\n16 games',
        headerClass: 'winners',
      },
      {
        rounds: ['W2'],
        sections: ['winners'],
        label: '4th Round W2\n8 games',
        headerClass: 'winners',
      },
      {
        rounds: ['W3'],
        sections: ['winners'],
        label: '4th Round W3\n4 games',
        headerClass: 'winners',
      },
      {
        rounds: ['W4'],
        sections: ['winners'],
        label: '11th Round W4\n2 games',
        headerClass: 'winners',
      },
      // Finals: SF in flow, F/3P centred
      {
        rounds: ['SF', 'F', '3P'],
        sections: ['finals'],
        label: 'Finals\n4 games',
        headerClass: 'finals',
        finalsStack: true,
      },
      // Losers bracket: mirrored (L6 closest to finals, L1 far right)
      {
        rounds: ['L6'],
        sections: ['losers'],
        label: '13th Round L6\n2 games',
        headerClass: 'losers',
      },
      {
        rounds: ['L5'],
        sections: ['losers'],
        label: '11th Round L5\n2 games',
        headerClass: 'losers',
      },
      {
        rounds: ['L4'],
        sections: ['losers'],
        label: '8th Round L4\n4 games',
        headerClass: 'losers',
        divisionTag: { text: '\u2192 DIVISION 2', cssClass: 'd2-tag' },
      },
      {
        rounds: ['L3'],
        sections: ['losers'],
        label: '6th Round L3\n4 games',
        headerClass: 'losers',
        divisionTag: { text: '\u2192 DIVISION 2', cssClass: 'd2-tag' },
      },
      {
        rounds: ['L2'],
        sections: ['losers'],
        label: '3rd Round L2\n8 games',
        headerClass: 'losers',
        divisionTag: l2Tag,
      },
      {
        rounds: ['L1'],
        sections: ['losers'],
        label: '2nd Round L1\n8 games',
        headerClass: 'losers',
        divisionTag: l1Tag,
      },
    ];
  }

  // ── D3 — 3-division variant (16-team single elimination) ──────
  if (division === 'D3' && divisionCount === 3) {
    return [
      {
        rounds: ['W1'],
        sections: ['winners'],
        label: '7th Round W1\n8 games',
        headerClass: 'winners',
      },
      {
        rounds: ['W2'],
        sections: ['winners'],
        label: '9th Round W2\n4 games',
        headerClass: 'winners',
      },
      {
        rounds: ['SF'],
        sections: ['finals'],
        label: 'Semi-Finals W3\n2 games',
        headerClass: 'finals',
      },
      {
        rounds: ['F', '3P'],
        sections: ['finals'],
        label: 'Round FINALS\n2 games',
        headerClass: 'finals',
        finalsPair: true,
      },
    ];
  }

  // ── D3 — 4-division variant (8-team single elimination) ───────
  if (division === 'D3' && divisionCount === 4) {
    return [
      {
        rounds: ['W1'],
        sections: ['winners'],
        label: '9th Round W1\n4 games',
        headerClass: 'winners',
      },
      {
        rounds: ['SF'],
        sections: ['finals'],
        label: 'Semi-Finals W2\n2 games',
        headerClass: 'finals',
      },
      {
        rounds: ['F', '3P'],
        sections: ['finals'],
        label: 'Round FINALS\n2 games',
        headerClass: 'finals',
        finalsPair: true,
      },
    ];
  }

  // ── D4 — only exists in 4-division (8-team single elimination) ─
  if (division === 'D4') {
    return [
      {
        rounds: ['W1'],
        sections: ['winners'],
        label: '7th Round W1\n4 games',
        headerClass: 'winners',
      },
      {
        rounds: ['SF'],
        sections: ['finals'],
        label: 'Semi-Finals W2\n2 games',
        headerClass: 'finals',
      },
      {
        rounds: ['F', '3P'],
        sections: ['finals'],
        label: 'Round FINALS\n2 games',
        headerClass: 'finals',
        finalsPair: true,
      },
    ];
  }

  // ── D2 — double elimination (8-team, same for 3/4-div) ────────
  if (division === 'D2') {
    return [
      // Winners
      {
        rounds: ['W1'],
        sections: ['winners'],
        label: '10th Round W1\n4 games',
        headerClass: 'winners',
      },
      {
        rounds: ['W2'],
        sections: ['winners'],
        label: '12th Round W2\n2 games',
        headerClass: 'winners',
      },
      // Finals: SF in flow, F/3P centred
      {
        rounds: ['SF', 'F', '3P'],
        sections: ['finals'],
        label: 'Finals\n4 games',
        headerClass: 'finals',
        finalsStack: true,
      },
      // Losers mirrored (L2 closest to finals, L1 far right)
      // NOTE: DB stores D2 losers as roundLabel 'D2 L1' / 'D2 L2' (sequential within D2).
      // deriveRound extracts 'L1' and 'L2' from those names.
      {
        rounds: ['L2'],
        sections: ['losers'],
        label: '14th Round L2\n2 games',
        headerClass: 'losers',
      },
      {
        rounds: ['L1'],
        sections: ['losers'],
        label: '12th Round L1\n2 games',
        headerClass: 'losers',
      },
    ];
  }

  return [];
}

/**
 * Return the list of division keys available for a given division count.
 */
export function getDivisionKeys(divisionCount: 3 | 4): string[] {
  return divisionCount === 4
    ? ['D1', 'D2', 'D3', 'D4']
    : ['D1', 'D2', 'D3'];
}

/**
 * Badge colour mapping for division tabs.
 */
export const divisionBadgeColors: Record<string, string> = {
  D1: 'bg-blue-500',
  D2: 'bg-purple-500',
  D3: 'bg-emerald-500',
  D4: 'bg-rose-500',
};

/**
 * Division tag colour mapping for Tailwind classes.
 * Maps the cssClass from divisionTag to Tailwind background colours.
 */
export const divisionTagBg: Record<string, string> = {
  'd2-tag': 'bg-purple-500',
  'd3-tag': 'bg-emerald-500',
  'd4-tag': 'bg-rose-500',
};
