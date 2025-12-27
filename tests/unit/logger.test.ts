import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "../../packages/vantage-sdk/src/utils/logger";

describe("Logger", () => {
  let logger: Logger;
  const consoleSpy = {
    log: vi.spyOn(console, "log"),
    warn: vi.spyOn(console, "warn"),
    error: vi.spyOn(console, "error"),
    debug: vi.spyOn(console, "debug")
  };

  beforeEach(() => {
    logger = new Logger({ level: 'debug' });
    vi.clearAllMocks();
  });

  it("should log info messages", () => {
    logger.info("Test message");
    expect(consoleSpy.log).toHaveBeenCalledWith("Test message");
  });

  it("should respect log levels", () => {
    logger.configure({ level: 'warn' });
    logger.info("Should not log");
    logger.warn("Should log");
    
    expect(consoleSpy.log).not.toHaveBeenCalled();
    expect(consoleSpy.warn).toHaveBeenCalledWith("Should log");
  });

  it("should support JSON format", () => {
    logger.configure({ format: 'json' });
    logger.info("Test");
    
    expect(consoleSpy.log).toHaveBeenCalled();
    const call = consoleSpy.log.mock.calls[0][0];
    const json = JSON.parse(call);
    expect(json.message).toBe("Test");
    expect(json.level).toBe("info");
  });
});

