/** Keys for persisted session data (easy to explain in viva). */
export const STORAGE_KEYS = {
  /** 'student' | 'peerTutor' — last login portal */
  loginRole: 'srms_login_role',
  /** ISO timestamp of the last successful login (used for calendar highlight). */
  lastLoginAt: 'srms_last_login_at',
  /** '1' if user opted to stay logged in (preference). */
  stayLoggedIn: 'srms_stay_logged_in',
  studentEmail: 'srms_student_email',
  /** JSON string array: recent successful login emails (newest first). */
  recentLoginEmails: 'srms_recent_login_emails',
  profileImageUri: 'srms_profile_image_uri',
  studentFullName: 'srms_student_full_name',
  studentId: 'srms_student_id',
  /** JSON array: poll-based session scheduling (tutor creates, students vote). */
  sessionPolls: 'srms_session_polls',
  /** Peer tutor default Zoom/Teams link for Kuppi confirmations (legacy / fallback). */
  tutorKuppiMeetingLink: 'srms_tutor_kuppi_meeting_link',
  /** JSON object: moduleId -> meeting URL (set from Create session scheduling → module). */
  tutorKuppiLinkByModule: 'srms_tutor_kuppi_link_by_module',
  /** JSON array: in-app notifications for students (e.g. new session poll). */
  studentNotifications: 'srms_student_notifications',
  /** JSON array: tutor library image uploads { category: notes|papers, uri, ... }. */
  tutorLibraryUploads: 'srms_tutor_library_uploads',
};
