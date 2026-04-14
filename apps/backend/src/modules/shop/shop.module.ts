import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CosmeticEntity } from './entities/cosmetic.entity';
import { UserCosmeticEntity } from './entities/user-cosmetic.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CosmeticEntity, UserCosmeticEntity, UserEntity])],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
