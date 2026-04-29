/**
 * Braille Mapping and Utility Functions
 * Unicode Braille Patterns: U+2800 - U+28FF
 */

export const UPPERCASE_INDICATOR = 0x08 | 0x20; // Dots 4, 6 (⠨)
export const SEMICOLON_DOTS = 0x02 | 0x04; // Dots 2, 3 (⠆)

export const BRAILLE_ALPHABET: Record<string, number> = {
  a: 0x01, // 1
  b: 0x01 | 0x02, // 1,2
  c: 0x01 | 0x08, // 1,4
  d: 0x01 | 0x08 | 0x10, // 1,4,5
  e: 0x01 | 0x10, // 1,5
  f: 0x01 | 0x02 | 0x08, // 1,2,4
  g: 0x01 | 0x02 | 0x08 | 0x10, // 1,2,4,5
  h: 0x01 | 0x02 | 0x10, // 1,2,5
  i: 0x02 | 0x08, // 2,4
  j: 0x02 | 0x08 | 0x10, // 2,4,5
  k: 0x01 | 0x04, // 1,3
  l: 0x01 | 0x02 | 0x04, // 1,2,3
  m: 0x01 | 0x04 | 0x08, // 1,3,4
  n: 0x01 | 0x04 | 0x08 | 0x10, // 1,3,4,5
  o: 0x01 | 0x04 | 0x10, // 1,3,5
  p: 0x01 | 0x02 | 0x04 | 0x08, // 1,2,3,4
  q: 0x01 | 0x02 | 0x04 | 0x08 | 0x10, // 1,2,3,4,5
  r: 0x01 | 0x02 | 0x04 | 0x10, // 1,2,3,5
  s: 0x02 | 0x04 | 0x08, // 2,3,4
  t: 0x02 | 0x04 | 0x08 | 0x10, // 2,3,4,5
  u: 0x01 | 0x04 | 0x20, // 1,3,6
  v: 0x01 | 0x02 | 0x04 | 0x20, // 1,2,3,6
  w: 0x02 | 0x08 | 0x10 | 0x20, // 2,4,5,6
  x: 0x01 | 0x04 | 0x08 | 0x20, // 1,3,4,6
  y: 0x01 | 0x04 | 0x08 | 0x10 | 0x20, // 1,3,4,5,6
  z: 0x01 | 0x04 | 0x10 | 0x20, // 1,3,5,6
  'á': 0x01 | 0x02 | 0x04 | 0x10 | 0x20, // 1-2-3-5-6
  'é': 0x02 | 0x04 | 0x08 | 0x20, // 2-3-4-6
  'í': 0x04 | 0x08, // 3-4
  'ó': 0x04 | 0x08 | 0x20, // 3-4-6
  'ú': 0x02 | 0x04 | 0x08 | 0x10 | 0x20, // 2-3-4-5-6
  'ñ': 0x01 | 0x02 | 0x08 | 0x10 | 0x20, // 1-2-4-5-6
  ';': SEMICOLON_DOTS,
};

/**
 * Mirror a single Braille character's column dots.
 * 1 <-> 4
 * 2 <-> 5
 * 3 <-> 6
 */
export function mirrorBrailleChar(code: number): number {
  if (code < 0) return code;
  let mirrored = 0;
  if (code & 0x01) mirrored |= 0x08; // 1 -> 4
  if (code & 0x08) mirrored |= 0x01; // 4 -> 1
  if (code & 0x02) mirrored |= 0x10; // 2 -> 5
  if (code & 0x10) mirrored |= 0x02; // 5 -> 2
  if (code & 0x04) mirrored |= 0x20; // 3 -> 6
  if (code & 0x20) mirrored |= 0x04; // 6 -> 3
  return mirrored;
}

export function charToBraille(char: string): number[] {
  const lower = char.toLowerCase();
  const codes: number[] = [];

  if (char !== lower && /[a-záéíóúñ]/.test(lower)) {
    codes.push(UPPERCASE_INDICATOR);
  }

  if (BRAILLE_ALPHABET[lower]) {
    codes.push(BRAILLE_ALPHABET[lower]);
  } else if (char === ' ') {
    codes.push(-1); // Special marker for space
  } else {
    // Keep unknown
  }

  return codes;
}

export function textToBrailleCodes(text: string, mirrored = false): number[][] {
  const lines = text.split('\n');
  return lines.map(line => {
    // Ignore spaces at the end of each line
    const trimmedLine = line.replace(/\s+$/, '');
    let lineCodes: number[] = [];
    for (const char of trimmedLine) {
      lineCodes.push(...charToBraille(char));
    }

    if (mirrored) {
      lineCodes.reverse();
      lineCodes = lineCodes.map(code => mirrorBrailleChar(code));
    }
    return lineCodes;
  });
}

export function toBrailleString(text: string, mirrored = false, spaceSymbol = '█'): string {
  const linesCodes = textToBrailleCodes(text, mirrored);
  return linesCodes.map(lineCodes => {
    return lineCodes.map(code => {
      if (code === -1) return spaceSymbol;
      return String.fromCharCode(0x2800 + (code >= 0 ? code : 0));
    }).join('');
  }).join('\n');
}

export function getBrailleLineLength(textLine: string): number {
  // Ignore spaces at the end of each line
  const trimmed = textLine.replace(/\s+$/, '');
  let count = 0;
  for (const char of trimmed) {
    count += charToBraille(char).length;
  }
  return count;
}

export function getUnsupportedCharacters(text: string): string[] {
  const unsupported = new Set<string>();
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.replace(/\s+$/, '');
    for (const char of trimmed) {
      const lower = char.toLowerCase();
      // Check if character is NOT in alphabet and NOT a space
      if (!BRAILLE_ALPHABET[lower] && char !== ' ') {
        unsupported.add(char);
      }
    }
  }
  return Array.from(unsupported);
}
