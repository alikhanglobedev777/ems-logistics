import { Module } from '@nestjs/common';
import { DeliveryProofsController } from './delivery-proofs.controller';
import { DeliveryProofsRepository } from './delivery-proofs.repository';
import { DeliveryProofsService } from './delivery-proofs.service';

@Module({
  controllers: [DeliveryProofsController],
  providers: [DeliveryProofsService, DeliveryProofsRepository],
})
export class DeliveryProofsModule {}
