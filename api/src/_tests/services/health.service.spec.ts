import { Test, TestingModule } from "@nestjs/testing";

import { HealthService } from "../../modules/health/health.service";

describe("HealthService", () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return health check status", async () => {
    const result = await service.check();

    expect(result).toBeDefined();
    expect(result.status).toBe("ok");
    expect(result.timestamp).toBeDefined();
    expect(result.uptime).toBeDefined();
    expect(result.memory).toBeDefined();
    expect(result.version).toBeDefined();
    expect(result.versions).toEqual({
      web: expect.any(String),
      api: expect.any(String),
      android: expect.any(String),
    });
  });

  it("should return readiness status", async () => {
    const result = await service.readiness();

    expect(result).toBeDefined();
    expect(result.status).toBe("ready");
    expect(result.timestamp).toBeDefined();
  });

  it("should return liveness status", async () => {
    const result = await service.liveness();

    expect(result).toBeDefined();
    expect(result.status).toBe("alive");
    expect(result.timestamp).toBeDefined();
  });
});
