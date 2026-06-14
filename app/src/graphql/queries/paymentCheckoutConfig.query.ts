import { gql } from "@apollo/client";

export const PAYMENT_CHECKOUT_CONFIG_QUERY = gql`
  query PaymentCheckoutConfig {
    paymentCheckoutConfig {
      paymentCards {
        cardNumber
        holderName
        bankName
      }
      cryptoWallets {
        address
        network
      }
      paymentMethods {
        method
        isVisible
        isActive
        isRecommended
      }
      usdtIrtRate {
        valueIrt
        feeUsdt
        coefficient
      }
    }
  }
`;
