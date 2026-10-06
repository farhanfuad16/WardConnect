import { afterEach, describe, expect, it } from "vitest";
import { resolvePhotoUrl } from "../lib/api-url";

describe("resolvePhotoUrl", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  });

  it("returns nothing when the report has no photo", () => {
    expect(resolvePhotoUrl(undefined)).toBeUndefined();
    expect(resolvePhotoUrl(null)).toBeUndefined();
    expect(resolvePhotoUrl("")).toBeUndefined();
  });

  it("anchors stored upload paths to this device's API base", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://192.168.10.233:3000";

    expect(resolvePhotoUrl("/uploads/photo.png")).toBe(
      "http://192.168.10.233:3000/uploads/photo.png",
    );
  });

  it("rebuilds absolute URLs recorded on another host", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://192.168.10.233:3000";

    expect(resolvePhotoUrl("http://localhost:3000/uploads/photo.png")).toBe(
      "http://192.168.10.233:3000/uploads/photo.png",
    );
    expect(resolvePhotoUrl("http://127.0.0.1:3000/uploads/photo.jpg?x=1")).toBe(
      "http://192.168.10.233:3000/uploads/photo.jpg",
    );
  });

  it("leaves remote photo hosts such as Cloudinary alone", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://192.168.10.233:3000";

    expect(resolvePhotoUrl("https://res.cloudinary.com/demo/image/upload/cat.jpg")).toBe(
      "https://res.cloudinary.com/demo/image/upload/cat.jpg",
    );
  });

  it("falls back to the local backend when no base url is configured", () => {
    expect(resolvePhotoUrl("/uploads/photo.png")).toBe("http://localhost:3000/uploads/photo.png");
  });
});
