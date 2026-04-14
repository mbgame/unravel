/**
 * User domain types shared between frontend and backend.
 */

/** Full user entity (used in authenticated responses). */
export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  totalScore: number;
  levelsCompleted: number;
  createdAt: string;
  updatedAt: string;
}

/** Public-facing user profile (no email). */
export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  totalScore: number;
  levelsCompleted: number;
}
