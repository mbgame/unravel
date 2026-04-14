/**
 * RegisterDto — validated payload for POST /auth/register.
 */

import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Data transfer object for new user registration.
 */
export class RegisterDto {
  /**
   * Unique display name.
   * Must be 3–32 alphanumeric characters, underscores, or hyphens.
   */
  @IsString()
  @MinLength(3, { message: 'username must be at least 3 characters' })
  @MaxLength(32, { message: 'username must not exceed 32 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'username may only contain letters, numbers, underscores and hyphens',
  })
  username!: string;

  /** Valid email address used for account identification. */
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  /**
   * Password — min 8 chars, must include at least one letter and one number.
   */
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128, { message: 'password must not exceed 128 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;
}
