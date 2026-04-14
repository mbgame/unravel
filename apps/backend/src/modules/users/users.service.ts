/**
 * UsersService — data-access layer for user profiles.
 * All DB operations go through the TypeORM repository.
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

/** Public profile shape — excludes sensitive fields. */
export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  totalScore: number;
  levelsCompleted: number;
  createdAt: Date;
}

/**
 * Service for querying and updating user records.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  /**
   * Returns the full user record by UUID.
   *
   * @param id - User UUID
   * @throws NotFoundException when no user exists with that ID
   */
  async findById(id: string): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  /**
   * Returns a sanitised public profile (no email, no password hash).
   *
   * @param id - User UUID
   */
  async getPublicProfile(id: string): Promise<PublicProfile> {
    const user = await this.findById(id);
    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      totalScore: user.totalScore,
      levelsCompleted: user.levelsCompleted,
      createdAt: user.createdAt,
    };
  }

  /**
   * Updates mutable profile fields for the requesting user.
   *
   * @param id - User UUID
   * @param dto - Fields to update
   * @throws ConflictException when the requested username is already taken
   */
  async updateMe(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    if (dto.username) {
      const clash = await this.repo.findOne({ where: { username: dto.username } });
      if (clash && clash.id !== id) {
        throw new ConflictException('That username is already taken');
      }
    }

    await this.repo.update(id, {
      ...(dto.username && { username: dto.username }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
    });

    return this.findById(id);
  }
}
