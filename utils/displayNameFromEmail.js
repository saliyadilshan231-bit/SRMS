/**
 * Remove a trailing "Student" word when it is used as a role label, not a surname.
 */
export function stripStudentRoleFromDisplayName(name) {
  if (!name || typeof name !== 'string') return '';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1 && words[words.length - 1].toLowerCase() === 'student') {
    return words.slice(0, -1).join(' ');
  }
  return name.trim();
}

/**
 * Strip trailing role labels (e.g. "Shehani, tutor" → "Shehani") for greetings and headers.
 */
export function stripRoleSuffixFromDisplayName(name) {
  let n = stripStudentRoleFromDisplayName(name);
  if (!n) return '';
  n = n.replace(/,?\s*tutor\s*$/i, '').trim();
  n = n.replace(/,?\s*peer\s*tutor\s*$/i, '').trim();
  const words = n.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words[words.length - 1].toLowerCase() === 'tutor') {
    n = words.slice(0, -1).join(' ');
  }
  n = n.replace(/,\s*$/, '').trim();
  return n;
}

/**
 * Build a friendly name from the email local part (before @).
 * e.g. shehani@gmail.com → "Shehani", john.doe@gmail.com → "John Doe"
 */
export function displayNameFromEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const local = email.trim().split('@')[0] || '';
  if (!local) return '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  // Login format is name.student@… — omit the role segment from display name
  const last = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  const nameParts =
    parts.length > 1 && (last === 'student' || last === 'tutor') ? parts.slice(0, -1) : parts;
  return nameParts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
