import { afterEach, describe, expect, it } from "vitest";
import { getApiBaseUrl } from "../lib/api-url";

describe("ward api discovery", () => {
  const originalWindow = (globalThis as any).window;
  const originalXMLHttpRequest = (globalThis as any).XMLHttpRequest;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
    if (originalXMLHttpRequest === undefined) {
      delete (globalThis as any).XMLHttpRequest;
    } else {
      (globalThis as any).XMLHttpRequest = originalXMLHttpRequest;
    }
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  });

  it("falls back to the local backend on localhost dev ports", () => {
    (globalThis as any).window = {
      location: {
        protocol: "http:",
        hostname: "localhost",
        port: "8081",
      },
    };

    expect(getApiBaseUrl()).toBe("http://localhost:3000");
  });

  it("switches to the next free local backend port when 3000 is occupied", () => {
    (globalThis as any).window = {
      location: {
        protocol: "http:",
        hostname: "localhost",
        port: "8081",
      },
    };

    const FakeXHR = class {
      public status = 0;
      public responseText = "";
      open(_method: string, url: string) {
        const isWorkingPort = url.includes(":3001");
        this.status = isWorkingPort ? 200 : 500;
        this.responseText = isWorkingPort
          ? JSON.stringify({ [url.includes("/notices?") ? "notices" : "incidents"]: [] })
          : JSON.stringify({ error: "Database not available" });
      }
      send() {
        return undefined;
      }
    };

    (globalThis as any).XMLHttpRequest = FakeXHR;

    expect(getApiBaseUrl()).toBe("http://localhost:3001");
  });
});
