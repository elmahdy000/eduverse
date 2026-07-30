import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateVendorDto,
  UpdateVendorDto,
} from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ── Expenses ──

  @Post()
  create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.createExpense(
      req.user.userId || req.user.id,
      createExpenseDto,
    );
  }

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expensesService.findAllExpenses({
      categoryId,
      vendorId,
      fromDate,
      toDate,
      status,
      paymentMethod,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
  }

  @Get('summary')
  getSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.expensesService.getFinancialSummary({ fromDate, toDate });
  }

  @Get('trend')
  getMonthlyTrend(@Query('months') months?: string) {
    return this.expensesService.getMonthlyTrend(months ? +months : 6);
  }

  @Get('top-vendors')
  getTopVendors(@Query('limit') limit?: string) {
    return this.expensesService.getTopVendors(limit ? +limit : 10);
  }

  // ── Categories ──

  @Get('categories')
  findAllCategories() {
    return this.expensesService.findAllCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.expensesService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.expensesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.expensesService.removeCategory(id);
  }

  // ── Vendors ──

  @Get('vendors')
  findAllVendors() {
    return this.expensesService.findAllVendors();
  }

  @Post('vendors')
  createVendor(@Body() dto: CreateVendorDto) {
    return this.expensesService.createVendor(dto);
  }

  @Patch('vendors/:id')
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.expensesService.updateVendor(id, dto);
  }

  @Delete('vendors/:id')
  removeVendor(@Param('id') id: string) {
    return this.expensesService.removeVendor(id);
  }

  // ── Single expense ──

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOneExpense(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.updateExpense(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.removeExpense(id);
  }
}
