/**
 * Braille Mapping and Utility Functions
 * Unicode Braille Patterns: U+2800 - U+28FF
 */

export const UPPERCASE_INDICATOR = 0x08 | 0x20; // Dots 4, 6 (⠨)
export const NUMBER_INDICATOR = 0x04 | 0x08 | 0x10 | 0x20; // Dots 3, 4, 5, 6 (⠼)
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
  'ü': 0x01 | 0x02 | 0x10 | 0x20, // 1-2-5-6
  'ñ': 0x01 | 0x02 | 0x08 | 0x10 | 0x20, // 1-2-4-5-6
  ';': SEMICOLON_DOTS,
  '.': 0x04, // 3
  ',': 0x02, // 2
  ':': 0x02 | 0x10, // 2-5
  '!': 0x02 | 0x04 | 0x10, // 2-3-5
  '¡': 0x02 | 0x04 | 0x10, // 2-3-5
  '?': 0x02 | 0x20, // 2-6
  '¿': 0x02 | 0x20, // 2-6
  '"': 0x02 | 0x04 | 0x20, // 2-3-6
  '-': 0x04 | 0x20, // 3-6
  '(': 0x02 | 0x04 | 0x10 | 0x20, // 2-3-5-6
  ')': 0x02 | 0x04 | 0x10 | 0x20, // 2-3-5-6
};

// Mapping for digits to their corresponding letter-dots
export const DIGIT_TO_LETTER: Record<string, string> = {
  '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e',
  '6': 'f', '7': 'g', '8': 'h', '9': 'i', '0': 'j'
};

export interface BrailleCellData {
  code: number;
  char: string;
  isIndicator: boolean;
}

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

  if (/[0-9]/.test(char)) {
    codes.push(NUMBER_INDICATOR);
    codes.push(BRAILLE_ALPHABET[DIGIT_TO_LETTER[char]]);
    return codes;
  }

  if (char !== lower && /[a-záéíóúñ]/.test(lower)) {
    codes.push(UPPERCASE_INDICATOR);
  }

  if (BRAILLE_ALPHABET[lower] !== undefined) {
    codes.push(BRAILLE_ALPHABET[lower]);
  } else if (char === ' ') {
    codes.push(-1); // Special marker for space
  }

  return codes;
}

export function textToBrailleCells(text: string, mirrored = false): BrailleCellData[][] {
  const lines = text.split('\n');
  return lines.map(line => {
    let lineCells: BrailleCellData[] = [];
    let inNumberMode = false;

    for (const char of line) {
      // Number logic
      if (/[0-9]/.test(char)) {
        if (!inNumberMode) {
          lineCells.push({
            code: NUMBER_INDICATOR,
            char: '#',
            isIndicator: true
          });
          inNumberMode = true;
        }
        lineCells.push({
          code: BRAILLE_ALPHABET[DIGIT_TO_LETTER[char]],
          char: char,
          isIndicator: false
        });
        continue;
      }

      // Reset number mode for anything else
      inNumberMode = false;

      const lower = char.toLowerCase();
      const isUpper = char !== lower && /[a-záéíóúñ]/.test(lower);
      
      if (isUpper) {
        lineCells.push({
          code: UPPERCASE_INDICATOR,
          char: char,
          isIndicator: true
        });
      }
      
      const dots = BRAILLE_ALPHABET[lower];
      if (dots !== undefined) {
        lineCells.push({
          code: dots,
          char: char,
          isIndicator: false
        });
      } else if (char === ' ') {
        lineCells.push({
          code: -1,
          char: ' ',
          isIndicator: false
        });
      }
    }

    if (mirrored) {
      lineCells.reverse();
      lineCells = lineCells.map(cell => ({
        ...cell,
        code: mirrorBrailleChar(cell.code)
      }));
    }
    return lineCells;
  });
}

export function textToBrailleCodes(text: string, mirrored = false): number[][] {
  const linesCells = textToBrailleCells(text, mirrored);
  return linesCells.map(line => line.map(cell => cell.code));
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
  const lineCells = textToBrailleCells(textLine, false)[0] || [];
  return lineCells.length;
}

export function getUnsupportedCharacters(text: string): string[] {
  const unsupported = new Set<string>();
  const lines = text.split('\n');
  for (const line of lines) {
    for (const char of line) {
      const lower = char.toLowerCase();
      // Check if character is NOT in alphabet, NOT a digit, and NOT a space
      if (!BRAILLE_ALPHABET[lower] && !/[0-9]/.test(char) && char !== ' ') {
        unsupported.add(char);
      }
    }
  }
  return Array.from(unsupported);
}
