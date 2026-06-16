import { Controller, Get, Query } from "@nestjs/common";

import { CourseService, ZarinPalVerificationResult } from "../course.service";

@Controller("courses/payment")
export class CoursePaymentController {
  constructor(private readonly courseService: CourseService) {}

  @Get("zarinpal/verify")
  async verifyZarinPalPayment(
    @Query("Authority") authority?: string,
    @Query("Status") status?: string,
  ): Promise<ZarinPalVerificationResult> {
    return this.courseService.verifyZarinPalPurchase(authority, status);
  }
}
