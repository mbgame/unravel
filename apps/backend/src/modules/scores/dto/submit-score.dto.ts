/**
 * SubmitScoreDto — validated payload for POST /scores.
 */

import { IsString, IsInt, IsUUID, Min, Max, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object for submitting a completed level attempt.
 * Server recalculates the score from these inputs; client-provided scores
 * are ignored to prevent cheating.
 */
export class SubmitScoreDto {
  /** UUID of the completed level. */
  @IsUUID('4', { message: 'levelId must be a valid UUID' })
  @IsNotEmpty()
  levelId!: string;

  /** Time taken to complete the level in milliseconds. */
  @IsInt()
  @Min(0)
  timeMs!: number;

  /** Number of moves made during the attempt. */
  @IsInt()
  @Min(0)
  moves!: number;

  /** Number of hints consumed. */
  @IsInt()
  @Min(0)
  @Max(10)
  hintsUsed!: number;
}
