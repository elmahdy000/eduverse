import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import {
  OwnerGuard,
  RoleGuard,
  SubscriptionPlanManagerGuard,
} from './role.guard';

function contextFor(
  roleId = 'role-1',
  requestOverrides: Record<string, unknown> = {},
): ExecutionContext {
  const request = {
    user: { id: 'user-1', roleId },
    method: 'GET',
    baseUrl: '/api/users',
    originalUrl: '/api/users',
    route: { path: '/' },
    ...requestOverrides,
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

  it('allows Receptionist to read inventory items', async () => {
    const prisma = {
      role: { findUnique: jest.fn().mockResolvedValue({ name: 'Receptionist' }) },
    };
    const guard = new RoleGuard(prisma as never);
    const context = contextFor('role-1', {
      method: 'GET',
      baseUrl: '/api/inventory',
      originalUrl: '/api/inventory/items',
      route: { path: '/items' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('does not allow Receptionist to modify inventory', async () => {
    const prisma = {
      role: { findUnique: jest.fn().mockResolvedValue({ name: 'Receptionist' }) },
    };
    const guard = new RoleGuard(prisma as never);
    const context = contextFor('role-1', {
      method: 'POST',
      baseUrl: '/api/inventory',
      originalUrl: '/api/inventory/items',
      route: { path: '/items' },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
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
