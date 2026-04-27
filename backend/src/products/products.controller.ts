import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    try {
      const product = await this.productsService.createProduct(createProductDto);
      return {
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProduct(@Param('id') productId: string) {
    try {
      const product = await this.productsService.getProduct(productId);
      return {
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List products with filters' })
  async listProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') category?: string,
    @Query('availability') availability?: string,
    @Query('active') active?: string,
    @Query('q') q?: string,
  ) {
    try {
      const result = await this.productsService.listProducts(Number(page), Number(limit), {
        category,
        availability:
          availability === undefined ? undefined : availability === 'true',
        active: active === undefined ? true : active === 'true',
        q,
      });

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
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(
    @Param('id') productId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    try {
      const product = await this.productsService.updateProduct(
        productId,
        updateProductDto,
      );
      return {
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate product' })
  async deactivateProduct(@Param('id') productId: string) {
    try {
      const product = await this.productsService.deactivateProduct(productId);
      return {
        success: true,
        data: product,
        message: 'Product deactivated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate product' })
  async reactivateProduct(@Param('id') productId: string) {
    try {
      const product = await this.productsService.reactivateProduct(productId);
      return {
        success: true,
        data: product,
        message: 'Product reactivated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
