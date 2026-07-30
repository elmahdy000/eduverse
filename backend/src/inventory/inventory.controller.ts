import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OpsManagerGuard, RoleGuard } from '../auth/role.guard';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('items')
  @ApiOperation({ summary: 'List all inventory items' })
  async listItems() {
    return this.inventoryService.listItems();
  }

  @Post('items')
  @ApiOperation({ summary: 'Create new inventory item' })
  async createItem(@Body() data: any, @Request() req: any) {
    return this.inventoryService.createItem(data, req?.user?.userId);
  }

  @Post('items/:id/add-stock')
  @ApiOperation({ summary: 'Add stock to item' })
  async addStock(
    @Param('id') itemId: string,
    @Body() body: { quantity: number; reason?: string },
    @Request() req: any,
  ) {
    return this.inventoryService.addStock(
      itemId,
      body.quantity,
      req.user.userId,
      body.reason,
    );
  }

  @Post('items/:id/withdraw')
  @ApiOperation({ summary: 'Withdraw/consume stock from item directly' })
  async withdrawStock(
    @Param('id') itemId: string,
    @Body() body: { quantity: number; reason: string },
    @Request() req: any,
  ) {
    return this.inventoryService.withdrawStock(
      itemId,
      body.quantity,
      req.user.userId,
      body.reason,
    );
  }

  @Post('products/:productId/recipe')
  @UseGuards(OpsManagerGuard)
  @ApiOperation({ summary: 'Set recipe for a product' })
  async setRecipe(
    @Param('productId') productId: string,
    @Body() body: { items: { inventoryItemId: string; quantity: number }[] },
  ) {
    return this.inventoryService.setRecipe(productId, body.items);
  }

  @Get('products/:productId/recipe')
  @ApiOperation({ summary: 'Get recipe for a product' })
  async getRecipe(@Param('productId') productId: string) {
    return this.inventoryService.getRecipe(productId);
  }

  @Post('waste')
  @UseGuards(OpsManagerGuard)
  @ApiOperation({ summary: 'Record inventory waste' })
  async recordWaste(
    @Body()
    body: { inventoryItemId: string; quantity: number; reason?: string },
    @Request() req: any,
  ) {
    return this.inventoryService.recordWaste(body, req.user.userId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items with stock below minimum level' })
  async getLowStock() {
    const items = await this.inventoryService.listItems();
    return items.filter(
      (item) => Number(item.currentStock) <= Number(item.minStockLevel),
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all inventory movement history' })
  async getTransactions(
    @Query('itemId') itemId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getTransactions(
      itemId,
      limit ? Number(limit) : 100,
    );
  }

  @Get('items/:id/transactions')
  @ApiOperation({
    summary: 'Get movement history for a specific inventory item',
  })
  async getItemTransactions(
    @Param('id') itemId: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getTransactions(
      itemId,
      limit ? Number(limit) : 50,
    );
  }

  @Get('waste-summary')
  @UseGuards(OpsManagerGuard)
  async getWasteSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    try {
      return await this.inventoryService.getWasteSummary(fromDate, toDate);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('stocktake')
  @ApiOperation({
    summary: 'Perform a batch stocktake and adjust inventory items',
  })
  async performStocktake(
    @Body()
    body: {
      items: {
        inventoryItemId: string;
        actualStock: number;
        reason?: string;
      }[];
    },
    @Request() req: any,
  ) {
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('Items array is required');
    }
    return this.inventoryService.performStocktake(body.items, req.user.userId);
  }
}
