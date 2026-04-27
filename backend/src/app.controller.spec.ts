import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return healthy payload', () => {
      const response = appController.getHealth();

      expect(response.success).toBe(true);
      expect(response.data.status).toBe('ok');
      expect(typeof response.data.timestamp).toBe('string');
      expect(typeof response.data.uptimeSeconds).toBe('number');
      expect(typeof response.timestamp).toBe('string');
    });
  });
});
