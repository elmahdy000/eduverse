import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import {
  OwnerGuard,
  RoleGuard,
  SubscriptionPlanManagerGuard,
} from './role.guard';

function contextFor(roleId = 'role-1'): ExecutionContext {
  const request = {
    user: { id: 'user-1', roleId },
    method: 'GET',
    baseUrl: '/api/users',
    originalUrl: '/api/users',
    route: { path: '/' },
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('role guards', () => {
  const ownerPortalRole = { id: 'role-1', name: 'OwnerPortal' };

  it('does not treat OwnerPortal as Owner in OwnerGuard', async () => {
    const prisma = {
      role: { findUnique: jest.fn().mockResolvedValue(ownerPortalRole) },
    };
    const guard = new OwnerGuard(prisma as never);

    await expect(guard.canActivate(contextFor())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not grant Owner permissions to OwnerPortal in RoleGuard', async () => {
    const prisma = {
      role: { findUnique: jest.fn().mockResolvedValue(ownerPortalRole) },
      permission: { findUnique: jest.fn().mockResolvedValue({ id: 'p-1' }) },
      rolePermission: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const guard = new RoleGuard(prisma as never);

    await expect(guard.canActivate(contextFor())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows Receptionist to manage subscription plans', async () => {
    const prisma = {
      role: {
        findUnique: jest.fn().mockResolvedValue({ name: 'Receptionist' }),
      },
    };
    const guard = new SubscriptionPlanManagerGuard(prisma as never);

    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });

  it('denies Barista from managing subscription plans', async () => {
    const prisma = {
      role: { findUnique: jest.fn().mockResolvedValue({ name: 'Barista' }) },
    };
    const guard = new SubscriptionPlanManagerGuard(prisma as never);

    await expect(guard.canActivate(contextFor())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
