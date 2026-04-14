/**
 * CreateLevelDto — validated payload for creating a new level (admin use).
 */

import {
  IsString,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsObject,
} from 'class-validator';

/**
 * Data transfer object for level creation.
 */
export class CreateLevelDto {
  /** Human-readable level name. */
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  /** Difficulty value from 1 (easiest) to 10 (hardest). */
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty!: number;

  /**
   * Full knot graph JSON (KnotGraph shape from shared-types).
   * Stored as JSONB in the database.
   */
  @IsObject()
  knotData!: Record<string, unknown>;

  /** Target completion time in milliseconds (for 3-star rating). */
  @IsInt()
  @Min(1000)
  parTimeMs!: number;

  /** Target move count (for 3-star rating). */
  @IsInt()
  @Min(1)
  parMoves!: number;

  /** Position in the level select ordering. */
  @IsInt()
  @Min(1)
  orderIndex!: number;

  /** Whether this level is marked as a daily challenge. */
  @IsOptional()
  @IsBoolean()
  isDaily?: boolean;
}
