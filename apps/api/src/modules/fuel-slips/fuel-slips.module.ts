import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FuelSlipsController } from './fuel-slips.controller';
import { FuelSlipsRepository } from './fuel-slips.repository';
import { FuelSlipsService } from './fuel-slips.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FuelSlipsController],
  providers: [FuelSlipsRepository, FuelSlipsService],
})
export class FuelSlipsModule {}
