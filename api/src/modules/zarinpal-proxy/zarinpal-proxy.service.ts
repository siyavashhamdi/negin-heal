import axios from "axios";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";

import { APP_SETTING_KEY, EXCEPTION_CONSTANT } from "../../constants";
import { AppSettingsService } from "../app-settings/app-settings.service";
import {
  ZarinPalProxyHttpError,
  ZarinPalProxyRequestBody,
  ZarinPalProxyRequestInput,
  ZarinPalProxyRequestResult,
  ZarinPalProxyVerifyBody,
  ZarinPalProxyVerifyInput,
  ZarinPalProxyVerifyResult,
} from "./zarinpal-proxy.types";

type StoredZarinPalProxyConfig = {
  proxyBaseUrl?: unknown;
  proxyApiKey?: unknown;
};

type ResolvedZarinPalProxyConfig = {
  baseUrl: string;
  apiKey: string;
};

@Injectable()
export class ZarinPalProxyService {
  private readonly logger = new Logger(ZarinPalProxyService.name);

  constructor(private readonly appSettingsService: AppSettingsService) {}

  async isEnabled(): Promise<boolean> {
    return (await this.resolveProxyConfig()) !== null;
  }

  async requestPayment(
    input: ZarinPalProxyRequestInput,
  ): Promise<ZarinPalProxyRequestResult> {
    const proxyConfig = await this.resolveProxyConfigOrThrow();
    const url = `${proxyConfig.baseUrl}/payment/request`;

    try {
      const { data } = await axios.post<ZarinPalProxyRequestBody>(
        url,
        {
          amountIrt: input.amountIrt,
          callbackUrl: input.callbackUrl,
          description: input.description,
          metadata: input.metadata,
        },
        {
          headers: this.buildHeaders(proxyConfig.apiKey),
          timeout: 30_000,
          validateStatus: () => true,
        },
      );

      if (
        !data?.ok ||
        typeof data.authority !== "string" ||
        !data.authority.trim() ||
        typeof data.paymentUrl !== "string" ||
        !data.paymentUrl.trim()
      ) {
        this.logger.warn(
          `ZarinPal proxy payment request failed: ${this.extractProxyErrorMessage(data) || "invalid response"}`,
        );
        throw new BadRequestException(
          EXCEPTION_CONSTANT.ZARINPAL_PAYMENT_FAILED,
        );
      }

      return {
        authority: data.authority.trim(),
        paymentUrl: data.paymentUrl.trim(),
        amountIrr: Number(data.amountIrr) || 0,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `ZarinPal proxy payment request error: ${this.extractProxyErrorMessage(error) || String(error)}`,
      );
      throw new BadRequestException(
        EXCEPTION_CONSTANT.ZARINPAL_CONNECTION_FAILED,
      );
    }
  }

  async verifyPayment(
    input: ZarinPalProxyVerifyInput,
  ): Promise<ZarinPalProxyVerifyResult> {
    const proxyConfig = await this.resolveProxyConfigOrThrow();
    const url = `${proxyConfig.baseUrl}/payment/verify`;

    try {
      const { data } = await axios.post<ZarinPalProxyVerifyBody>(
        url,
        {
          authority: input.authority,
          amountIrt: input.amountIrt,
          ...(input.status ? { status: input.status } : {}),
        },
        {
          headers: this.buildHeaders(proxyConfig.apiKey),
          timeout: 30_000,
        },
      );

      if (data?.status === "cancelled") {
        return {
          status: "cancelled",
          message: typeof data.message === "string" ? data.message : undefined,
        };
      }

      if (data?.ok && data.status === "success") {
        const refId =
          typeof data.refId === "string" && data.refId.trim()
            ? data.refId.trim()
            : undefined;

        return {
          status: "success",
          refId,
          message: typeof data.message === "string" ? data.message : undefined,
          zarinpalCode:
            typeof data.zarinpalCode === "number"
              ? data.zarinpalCode
              : undefined,
        };
      }

      return {
        status: "failed",
        message: this.extractProxyErrorMessage(data),
        zarinpalCode:
          typeof data?.zarinpalCode === "number"
            ? data.zarinpalCode
            : undefined,
      };
    } catch (error) {
      this.logger.error(
        `ZarinPal proxy verification error: ${this.extractProxyErrorMessage(error) || String(error)}`,
      );

      return {
        status: "failed",
        message: this.extractProxyErrorMessage(error),
      };
    }
  }

  private async resolveProxyConfig(): Promise<ResolvedZarinPalProxyConfig | null> {
    const parsedConfig =
      await this.appSettingsService.getActiveJsonSettingValue<StoredZarinPalProxyConfig>(
        APP_SETTING_KEY.ZARINPAL_CONFIG,
      );

    if (!parsedConfig || Array.isArray(parsedConfig)) {
      return null;
    }

    const baseUrl =
      typeof parsedConfig.proxyBaseUrl === "string"
        ? parsedConfig.proxyBaseUrl.trim().replace(/\/+$/, "")
        : "";

    // Empty proxyBaseUrl means direct ZarinPal calls (legacy / local dev path).
    if (baseUrl === "") {
      return null;
    }

    const apiKey =
      typeof parsedConfig.proxyApiKey === "string"
        ? parsedConfig.proxyApiKey.trim()
        : "";

    if (apiKey === "") {
      return null;
    }

    return { baseUrl, apiKey };
  }

  private async resolveProxyConfigOrThrow(): Promise<ResolvedZarinPalProxyConfig> {
    const proxyConfig = await this.resolveProxyConfig();

    if (!proxyConfig) {
      throw new BadRequestException(EXCEPTION_CONSTANT.ZARINPAL_CONFIG_ERROR);
    }

    return proxyConfig;
  }

  private buildHeaders(apiKey: string): Record<string, string> {
    return {
      accept: "application/json",
      "content-type": "application/json",
      "x-proxy-key": apiKey,
    };
  }

  private extractProxyErrorMessage(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null) {
      return error instanceof Error ? error.message : undefined;
    }

    const axiosError = error as ZarinPalProxyHttpError;
    const responseData = axiosError.response?.data ?? error;
    const payload =
      typeof responseData === "object" && responseData !== null
        ? (responseData as ZarinPalProxyRequestBody)
        : undefined;

    if (payload?.message) {
      return payload.message;
    }

    return axiosError.response?.statusText || axiosError.message;
  }
}
