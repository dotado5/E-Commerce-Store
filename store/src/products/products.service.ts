import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private productsRepository: ProductsRepository) {}

  create(data: Prisma.ProductCreateInput) {
    return this.productsRepository.create(data);
  }

  findAll() {
    return this.productsRepository.findAll();
  }

  findOne(id: number) {
    return this.productsRepository.findOne(id);
  }

  update(id: number, data: Prisma.ProductUpdateInput) {
    return this.productsRepository.update(id, data);
  }

  remove(id: number) {
    return this.productsRepository.remove(id);
  }
}
