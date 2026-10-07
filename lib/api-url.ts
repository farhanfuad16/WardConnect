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

/**
 * Turn a stored photo value into a URL the current device can actually load.
 *
 * Local uploads are stored as "/uploads/<file>" and older rows may hold an
 * absolute URL built from whichever host uploaded them (localhost, a LAN
 * address, ...), so both are re-anchored to this device's API base. Remote
 * URLs such as Cloudinary are returned untouched.
 */
export function resolvePhotoUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl) return undefined;
  const base = getApiBaseUrl();
  if (photoUrl.startsWith("/")) return `${base}${photoUrl}`;
  const localUpload = photoUrl.match(/^https?:\/\/[^/?#]+(\/uploads\/[^?#]+)/i);
  if (localUpload) return `${base}${localUpload[1]}`;
  return photoUrl;
}
