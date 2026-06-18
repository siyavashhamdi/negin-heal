import { Injectable, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";

const SCHEDULE_CRON_OPTIONS = "SCHEDULE_CRON_OPTIONS";

@Injectable()
export class CronDisplayNameService implements OnModuleInit {
  private readonly explicitNames = new Map<string, string>();
  private readonly unnamedDisplayNames: string[] = [];

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    this.collectCronDisplayNames();
  }

  resolve(schedulerName: string): string {
    const explicitName = this.explicitNames.get(schedulerName);
    if (explicitName) {
      return explicitName;
    }

    const unnamedName = this.unnamedDisplayNames.shift();
    return unnamedName ?? schedulerName;
  }

  private collectCronDisplayNames(): void {
    const instanceWrappers = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];

    for (const wrapper of instanceWrappers) {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) {
        continue;
      }

      const methodNames = this.metadataScanner.getAllMethodNames(
        Object.getPrototypeOf(instance),
      );

      for (const methodName of methodNames) {
        const methodRef = instance[methodName] as (
          ...args: unknown[]
        ) => unknown;
        const cronMetadata = this.reflector.get<{ name?: string } | undefined>(
          SCHEDULE_CRON_OPTIONS,
          methodRef,
        );

        if (!cronMetadata) {
          continue;
        }

        const className =
          instance.constructor?.name ?? wrapper.name ?? "Unknown";
        const displayName = `${className}.${methodName}`;

        if (cronMetadata.name) {
          this.explicitNames.set(cronMetadata.name, displayName);
        } else {
          this.unnamedDisplayNames.push(displayName);
        }
      }
    }
  }
}
