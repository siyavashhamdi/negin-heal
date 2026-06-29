import { Controller, Get, Query } from "@nestjs/common";

import { ProductService, ZarinPalVerificationResult } from "../product.service";

@Controller("courses/payment")
export class ProductPaymentController {
  constructor(private readonly productService: ProductService) {}

  @Get("zarinpal/verify")
  async verifyZarinPalPayment(
    @Query("Authority") authority?: string,
    @Query("Status") status?: string,
  ): Promise<ZarinPalVerificationResult> {
    return this.productService.verifyZarinPalPurchase(authority, status);
  }
}
