import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('returns EMS API health response', () => {
      expect(appController.getHealth()).toMatchObject({
        data: {
          status: 'ok',
          service: 'ems-api',
        },
      });
    });
  });
});
