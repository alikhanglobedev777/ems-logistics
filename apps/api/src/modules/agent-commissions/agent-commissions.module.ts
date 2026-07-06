import { Module } from '@nestjs/common';
import { AgentCommissionsController } from './agent-commissions.controller';
import { AgentCommissionsRepository } from './agent-commissions.repository';
import { AgentCommissionsService } from './agent-commissions.service';

@Module({
  controllers: [AgentCommissionsController],
  providers: [AgentCommissionsService, AgentCommissionsRepository],
})
export class AgentCommissionsModule {}
