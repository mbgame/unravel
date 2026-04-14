/**
 * LoginDto — validated payload for POST /auth/login.
 */

import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Data transfer object for user login.
 */
export class LoginDto {
  /** Registered email address. */
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  /** Account password (8–128 chars). */
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128, { message: 'password must not exceed 128 characters' })
  password!: string;
}
