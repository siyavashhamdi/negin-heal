import { Field, Float, ObjectType } from "@nestjs/graphql";

import { UserProductPaymentMethod } from "../../../../enums";

@ObjectType()
export class PaymentCheckoutCardGqlResponse {
  @Field({ description: "Payment card number" })
  cardNumber: string;

  @Field({ description: "Payment card holder name" })
  holderName: string;

  @Field({ description: "Payment card bank name" })
  bankName: string;
}

@ObjectType()
export class PaymentCheckoutCryptoWalletGqlResponse {
  @Field({ description: "Crypto wallet address" })
  address: string;

  @Field({ description: "Crypto wallet network" })
  network: string;
}

@ObjectType()
export class PaymentCheckoutMethodGqlResponse {
  @Field(() => UserProductPaymentMethod, {
    description: "Payment method identifier",
  })
  method: UserProductPaymentMethod;

  @Field({ description: "Whether the method should be shown in checkout" })
  isVisible: boolean;

  @Field({ description: "Whether the method can currently be selected" })
  isActive: boolean;

  @Field({ description: "Whether the method should be marked as recommended" })
  isRecommended: boolean;
}

@ObjectType()
export class PaymentCheckoutUsdtIrtRateGqlResponse {
  @Field(() => Float, {
    description: "IRT value equivalent to one USDT before fee/coefficient",
  })
  valueIrt: number;

  @Field(() => Float, {
    description: "Fixed USDT fee added after conversion",
  })
  feeUsdt: number;

  @Field(() => Float, {
    description: "Multiplier applied to converted USDT amount",
  })
  coefficient: number;
}

@ObjectType()
export class PaymentCheckoutConfigGqlResponse {
  @Field(() => [PaymentCheckoutCardGqlResponse], {
    description: "Available payment cards",
  })
  paymentCards: PaymentCheckoutCardGqlResponse[];

  @Field(() => [PaymentCheckoutCryptoWalletGqlResponse], {
    description: "Available cryptocurrency wallets",
  })
  cryptoWallets: PaymentCheckoutCryptoWalletGqlResponse[];

  @Field(() => [PaymentCheckoutMethodGqlResponse], {
    description: "Payment method visibility and availability configuration",
  })
  paymentMethods: PaymentCheckoutMethodGqlResponse[];

  @Field(() => PaymentCheckoutUsdtIrtRateGqlResponse, {
    description: "USDT to IRT conversion settings",
  })
  usdtIrtRate: PaymentCheckoutUsdtIrtRateGqlResponse;
}
