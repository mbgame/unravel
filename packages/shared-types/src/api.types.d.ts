export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}
export interface ApiError {
    success: false;
    statusCode: number;
    message: string;
    errors?: string[];
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
}
export interface RegisterDto {
    username: string;
    email: string;
    password: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface SubmitScoreDto {
    levelId: string;
    timeMs: number;
    moves: number;
    hintsUsed: number;
}
