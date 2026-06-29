import { Query, Resolver } from "@nestjs/graphql";

import { AppSettingsService } from "../../app-settings.service";
import { PaymentCheckoutConfigGqlResponse } from "../responses";

@Resolver(() => PaymentCheckoutConfigGqlResponse)
export class PaymentCheckoutConfigQuery {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Query(() => PaymentCheckoutConfigGqlResponse, {
    name: "paymentCheckoutConfig",
    description: "Get payment checkout settings for product purchases",
  })
  async getPaymentCheckoutConfig(): Promise<PaymentCheckoutConfigGqlResponse> {
    return this.appSettingsService.getPaymentCheckoutConfig();
  }
}
