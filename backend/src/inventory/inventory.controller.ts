import { Controller, Get, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OpsManagerGuard } from '../auth/role.guard';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('items')
  @ApiOperation({ summary: 'List all inventory items' })
  async listItems() {
    return this.inventoryService.listItems();
  }

  @Post('items')
  @UseGuards(OpsManagerGuard)
  @ApiOperation({ summary: 'Create new inventory item (Admin/Ops only)' })
  async createItem(@Body() data: any) {
    return this.inventoryService.createItem(data);
  }

  @Post('items/:id/add-stock')
  @UseGuards(OpsManagerGuard)
  @ApiOperation({ summary: 'Add stock to item' })
  async addStock(
    @Param('id') itemId: string,
    @Body() body: { quantity: number; reason?: string },
    @Request() req: any
  ) {
    return this.inventoryService.addStock(itemId, body.quantity, req.user.userId, body.reason);
  }

  @Post('products/:productId/recipe')
  @UseGuards(OpsManagerGuard)
  @ApiOperation({ summary: 'Set recipe for a product' })
  async setRecipe(
    @Param('productId') productId: string,
    @Body() body: { items: { inventoryItemId: string; quantity: number }[] }
  ) {
    return this.inventoryService.setRecipe(productId, body.items);
  }
}
