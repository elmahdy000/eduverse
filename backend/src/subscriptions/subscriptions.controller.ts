import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard, OpsManagerGuard } from '../auth/role.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RoleGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ── Plans (الباقات) ──

  @Get('plans')
  findAllPlans(@Query('all') all?: string) {
    return this.subscriptionsService.findAllPlans(all === 'true');
  }

  @Get('plans/:id')
  findPlan(@Param('id') id: string) {
    return this.subscriptionsService.findPlan(id);
  }

  @Post('plans')
  @UseGuards(OpsManagerGuard)
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch('plans/:id')
  @UseGuards(OpsManagerGuard)
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @UseGuards(OpsManagerGuard)
  deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.deletePlan(id);
  }

  // ── Customer Subscriptions (اشتراكات العملاء) ──

  @Post()
  subscribe(@Body() dto: CreateSubscriptionDto, @Request() req: any) {
    return this.subscriptionsService.subscribe(dto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('packageType') packageType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionsService.findAllSubscriptions({
      customerId,
      status,
      packageType,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('active/:customerId')
  getActive(@Param('customerId') customerId: string) {
    return this.subscriptionsService.getActiveSubscription(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findSubscription(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.updateSubscription(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.subscriptionsService.cancelSubscription(id, req.user.userId);
  }

  @Post('expire')
  @UseGuards(OpsManagerGuard)
  expireOverdue() {
    return this.subscriptionsService.expireOverdue();
  }
}
