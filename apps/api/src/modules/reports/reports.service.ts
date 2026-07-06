import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  async dashboard() {
    return { data: await this.repo.dashboard(), message: 'Success' };
  }
}
