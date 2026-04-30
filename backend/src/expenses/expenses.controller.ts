import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, CreateCategoryDto, CreateVendorDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    // نستخدم req.user.userId لأن هذا هو المسمى المتبع في JwtStrategy لهذا المشروع
    return this.expensesService.createExpense(req.user.userId || req.user.id, createExpenseDto);
  }

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expensesService.findAllExpenses({
      categoryId,
      vendorId,
      fromDate,
      toDate,
      status,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
  }

  @Get('summary')
  getSummary(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.expensesService.getFinancialSummary({ fromDate, toDate });
  }

  @Get('categories')
  findAllCategories() {
    return this.expensesService.findAllCategories();
  }

  @Post('categories')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.expensesService.createCategory(createCategoryDto);
  }

  @Get('vendors')
  findAllVendors() {
    return this.expensesService.findAllVendors();
  }

  @Post('vendors')
  createVendor(@Body() createVendorDto: CreateVendorDto) {
    return this.expensesService.createVendor(createVendorDto);
  }

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
