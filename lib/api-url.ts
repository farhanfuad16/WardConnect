export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  function hasWorkingHomeApi(candidate: string): boolean {
    if (typeof XMLHttpRequest === "undefined") {
      return false;
    }

    try {
      return ["notices", "incidents"].every((resource) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `${candidate}/api/${resource}?limit=1`, false);
        xhr.send();
        if (xhr.status < 200 || xhr.status >= 400) return false;

        const payload = JSON.parse(xhr.responseText);
        return Array.isArray(payload[resource]);
      });
    } catch {
      return false;
    }
  }

  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const candidates = [
        `${protocol}//${hostname}:3000`,
        `${protocol}//${hostname}:3001`,
      ];

      for (const candidate of candidates) {
        if (hasWorkingHomeApi(candidate)) {
          return candidate;
        }
      }

      return candidates[0];
    }

    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  return "http://localhost:3000";
}
