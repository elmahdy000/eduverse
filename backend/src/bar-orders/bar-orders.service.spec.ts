import { BadRequestException } from '@nestjs/common';
import { BarOrdersService } from './bar-orders.service';

describe('BarOrdersService security rules', () => {
  it('rejects short predictable guest codes', async () => {
    const prisma = { session: { findFirst: jest.fn() } };
    const service = new BarOrdersService(prisma as never, {} as never);

    await expect(service.validateGuestCode('1')).resolves.toBe(false);
    expect(prisma.session.findFirst).not.toHaveBeenCalled();
  });

  it('prevents cancellation after an order is linked to an invoice', async () => {
    const prisma = {
      barOrder: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          status: 'ready',
          invoiceId: 'invoice-1',
        }),
        update: jest.fn(),
      },
    };
    const service = new BarOrdersService(prisma as never, {} as never);

    await expect(
      service.cancelOrder('order-1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.barOrder.update).not.toHaveBeenCalled();
  });
});
