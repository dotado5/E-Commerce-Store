import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { Prisma } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import {
  CACHE_TTL_SECONDS,
  productKey,
  productsListKey,
} from '../redis/cache-keys';

@Injectable()
export class ProductsService {
  constructor(
    private productsRepository: ProductsRepository,
    private redis: RedisService,
  ) {}

  async create(data: Prisma.ProductCreateInput) {
    const product = await this.productsRepository.create(data);
    await this.redis.del(productsListKey());
    return product;
  }

  async findAll() {
    const cached = await this.redis.get(productsListKey());
    if (cached) return cached;

    const products = await this.productsRepository.findAll();
    await this.redis.set(productsListKey(), products, CACHE_TTL_SECONDS);
    return products;
  }

  async findOne(id: number) {
    const cached = await this.redis.get(productKey(id));
    if (cached) return cached;

    const product = await this.productsRepository.findOne(id);
    if (product) {
      await this.redis.set(productKey(id), product, CACHE_TTL_SECONDS);
    }
    return product;
  }

  async update(id: number, data: Prisma.ProductUpdateInput) {
    const product = await this.productsRepository.update(id, data);
    await this.redis.del(productKey(id), productsListKey());
    return product;
  }

  async remove(id: number) {
    const product = await this.productsRepository.remove(id);
    await this.redis.del(productKey(id), productsListKey());
    return product;
  }
}
