/**
 * Returns true when the email contains `.staff@` (e.g. saliya.staff@gmail.com)
 */
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase().includes('.staff@');
}
