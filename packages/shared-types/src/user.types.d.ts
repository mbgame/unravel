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
export interface UserProfile {
    id: string;
    username: string;
    avatarUrl?: string;
    totalScore: number;
    levelsCompleted: number;
}
