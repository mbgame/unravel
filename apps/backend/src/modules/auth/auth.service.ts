/**
 * AuthService — handles registration, login, token refresh, and logout.
 * All password hashing uses bcrypt with BCRYPT_ROUNDS=12.
 * Refresh tokens are stored as bcrypt hashes in the database.
 */

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

/** bcrypt work factor for password and refresh-token hashing. */
const BCRYPT_ROUNDS = 12;

/** Public user fields returned to the client (no sensitive data). */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  totalScore: number;
  levelsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape of the auth response returned to the client. */
export interface AuthResponse {
  user: AuthUser;
  /** Short-lived access token (15 min). */
  accessToken: string;
  /** Long-lived refresh token (7 days, opaque to client). */
  refreshToken: string;
}

/**
 * Core authentication service.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user, hashes their password, and returns auth tokens.
   *
   * @param dto - Registration payload
   * @throws ConflictException if username or email is already taken
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existing) {
      const field = existing.email === dto.email ? 'email' : 'username';
      throw new ConflictException(`That ${field} is already registered`);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });

    const saved = await this.usersRepo.save(user);
    return this.issueTokens(saved);
  }

  /**
   * Validates email + password credentials.
   * Returns the user entity on success, or `null` on failure.
   *
   * @param email - User email
   * @param password - Plain-text password
   */
  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user : null;
  }

  /**
   * Issues tokens for a pre-validated user (called by LocalAuthGuard flow).
   *
   * @param user - Validated user entity
   */
  async login(user: UserEntity): Promise<AuthResponse> {
    return this.issueTokens(user);
  }

  /**
   * Validates a refresh token and returns a new access token.
   *
   * @param refreshToken - The opaque refresh token string
   * @throws UnauthorizedException when invalid or expired
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      const secret = this.configService.get<string>('jwt.refreshSecret');
      payload = this.jwtService.verify<JwtPayload>(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const accessToken = this.signAccessToken(user);
    return { accessToken };
  }

  /**
   * Invalidates the stored refresh token hash for the given user.
   *
   * @param userId - UUID of the user to log out
   */
  async logout(userId: string): Promise<void> {
    await this.usersRepo.update(userId, { refreshTokenHash: undefined });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Signs and persists both tokens for a user, returns full auth response.
   */
  private async issueTokens(user: UserEntity): Promise<AuthResponse> {
    const accessToken = this.signAccessToken(user);
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');

    if (!refreshSecret) throw new InternalServerErrorException('JWT refresh secret not configured');

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email } satisfies JwtPayload,
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersRepo.update(user.id, { refreshTokenHash });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        totalScore: user.totalScore,
        levelsCompleted: user.levelsCompleted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Signs a short-lived access token.
   */
  private signAccessToken(user: UserEntity): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
