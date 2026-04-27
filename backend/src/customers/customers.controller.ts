import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  SearchCustomerDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Register new customer' })
  async createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
    @Request() req: any,
  ) {
    try {
      const customer = await this.customersService.createCustomer(
        createCustomerDto,
        req.user.userId,
      );
      return {
        success: true,
        data: customer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  async getCustomer(@Param('id') customerId: string) {
    try {
      const customer = await this.customersService.getCustomer(customerId);
      return {
        success: true,
        data: customer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Search customers with filters' })
  async searchCustomers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('name') name?: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
    @Query('customerType') customerType?: string,
    @Query('college') college?: string,
    @Query('employerName') employerName?: string,
  ) {
    try {
      const search: SearchCustomerDto = {
        name,
        phone,
        email,
        customerType,
        college,
        employerName,
      };
      const result = await this.customersService.searchCustomers(
        page,
        limit,
        search,
      );
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer information' })
  async updateCustomer(
    @Param('id') customerId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    try {
      const customer = await this.customersService.updateCustomer(
        customerId,
        updateCustomerDto,
      );
      return {
        success: true,
        data: customer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get customer visit and transaction history' })
  async getCustomerHistory(@Param('id') customerId: string) {
    try {
      const history = await this.customersService.getCustomerHistory(
        customerId,
      );
      return {
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/active-session')
  @ApiOperation({ summary: 'Get active session for customer' })
  async getActiveSession(@Param('id') customerId: string) {
    try {
      const session = await this.customersService.getActiveSession(customerId);
      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate customer' })
  async deactivateCustomer(@Param('id') customerId: string) {
    try {
      const customer = await this.customersService.deactivateCustomer(
        customerId,
      );
      return {
        success: true,
        data: customer,
        message: 'Customer deactivated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/blacklist')
  @ApiOperation({ summary: 'Blacklist customer' })
  async blacklistCustomer(
    @Param('id') customerId: string,
    @Body('reason') reason: string,
  ) {
    try {
      const customer = await this.customersService.blacklistCustomer(
        customerId,
        reason,
      );
      return {
        success: true,
        data: customer,
        message: 'Customer blacklisted',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate customer' })
  async reactivateCustomer(@Param('id') customerId: string) {
    try {
      const customer = await this.customersService.reactivateCustomer(
        customerId,
      );
      return {
        success: true,
        data: customer,
        message: 'Customer reactivated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
