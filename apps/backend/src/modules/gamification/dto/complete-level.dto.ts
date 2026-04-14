import { IsInt, Min, Max } from 'class-validator';

/**
 * DTO for completing a level and claiming coins + XP.
 */
export class CompleteLevelDto {
  /** The level number that was completed (1-based). */
  @IsInt()
  @Min(1)
  @Max(9999)
  levelNumber!: number;

  /** Coins collected from yarn balls during the level. */
  @IsInt()
  @Min(0)
  @Max(500)
  coinsEarned!: number;

  /** Whether the level was cleared with zero penalty balls. */
  @IsInt()
  @Min(0)
  @Max(5)
  penaltyCount!: number;
}
