import { Module } from '@nestjs/common';
import { ContractRatesController } from './contract-rates.controller';
import { ContractRatesRepository } from './contract-rates.repository';
import { ContractRatesService } from './contract-rates.service';

@Module({
  controllers: [ContractRatesController],
  providers: [ContractRatesService, ContractRatesRepository],
  exports: [ContractRatesService, ContractRatesRepository],
})
export class ContractRatesModule {}
