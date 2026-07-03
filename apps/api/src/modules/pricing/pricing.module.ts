import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingReadRepository } from './pricing-read.repository';
import { PricingService } from './pricing.service';

@Module({
  controllers: [PricingController],
  providers: [PricingService, PricingReadRepository],
})
export class PricingModule {}
