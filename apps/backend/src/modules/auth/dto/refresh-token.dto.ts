/**
 * RefreshTokenDto — validated payload for POST /auth/refresh.
 */

import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object carrying the opaque refresh token string.
 */
export class RefreshTokenDto {
  /** Refresh token issued at login or previous refresh. */
  @IsString()
  @IsNotEmpty({ message: 'refreshToken must not be empty' })
  refreshToken!: string;
}
