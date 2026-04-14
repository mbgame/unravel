/**
 * UpdateUserDto — validated payload for PATCH /users/me.
 */

import { IsOptional, IsString, MinLength, MaxLength, Matches, IsUrl } from 'class-validator';

/**
 * Data transfer object for updating the current user's profile.
 * All fields are optional; only provided fields are updated.
 */
export class UpdateUserDto {
  /**
   * New display username (3–32 alphanumeric chars, underscores, hyphens).
   */
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'username must be at least 3 characters' })
  @MaxLength(32, { message: 'username must not exceed 32 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'username may only contain letters, numbers, underscores and hyphens',
  })
  username?: string;

  /** URL to the user's avatar image. */
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  @MaxLength(500)
  avatarUrl?: string;
}
