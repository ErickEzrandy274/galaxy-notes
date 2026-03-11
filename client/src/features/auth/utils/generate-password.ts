const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIALS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const ALL = UPPERCASE + LOWERCASE + DIGITS + SPECIALS;

export function generatePassword(length = 16): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  const guaranteed = [
    UPPERCASE[array[0] % UPPERCASE.length],
    LOWERCASE[array[1] % LOWERCASE.length],
    DIGITS[array[2] % DIGITS.length],
    SPECIALS[array[3] % SPECIALS.length],
  ];

  const remaining = Array.from({ length: length - 4 }, (_, i) =>
    ALL[array[i + 4] % ALL.length],
  );

  const combined = [...guaranteed, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}
