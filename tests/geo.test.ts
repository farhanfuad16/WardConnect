import { describe, expect, it } from "vitest";
import { distanceMeters, formatCoords, formatDistance, toCoords } from "../lib/geo";
import { buildPayload, parseMapEvent, serializePayload } from "../lib/leaflet-html";

describe("toCoords", () => {
  it("parses the decimal strings the API returns", () => {
    expect(toCoords("23.8103000", "90.3681000")).toEqual({ latitude: 23.8103, longitude: 90.3681 });
  });

  it("returns undefined for missing or invalid values", () => {
    expect(toCoords(null, null)).toBeUndefined();
    expect(toCoords(undefined, "90.1")).toBeUndefined();
    expect(toCoords("", "")).toBeUndefined();
    expect(toCoords("abc", "90.1")).toBeUndefined();
  });

  it("keeps a legitimate zero coordinate", () => {
    expect(toCoords("0", "0")).toEqual({ latitude: 0, longitude: 0 });
  });
});

describe("distance", () => {
  const mirpur10 = { latitude: 23.8069, longitude: 90.3687 };
  const mirpur1 = { latitude: 23.7956, longitude: 90.3537 };

  it("is zero between identical points", () => {
    expect(distanceMeters(mirpur10, mirpur10)).toBe(0);
  });

  it("matches the known distance between Mirpur 10 and Mirpur 1 (~2 km)", () => {
    const d = distanceMeters(mirpur10, mirpur1);
    expect(d).toBeGreaterThan(1800);
    expect(d).toBeLessThan(2200);
  });

  it("formats metres and kilometres", () => {
    expect(formatDistance(42)).toBe("40 m");
    expect(formatDistance(980)).toBe("980 m");
    expect(formatDistance(2140)).toBe("2.1 km");
    expect(formatDistance(15200)).toBe("15 km");
  });

  it("formats coordinates to five places", () => {
    expect(formatCoords({ latitude: 23.81034, longitude: 90.36812 })).toBe("23.81034, 90.36812");
  });
});

describe("map payload", () => {
  it("marks the map pickable only when a pin handler is supplied", () => {
    expect(buildPayload({}, false).pickable).toBe(false);
    expect(buildPayload({ onPinChange: () => {} }, false).pickable).toBe(true);
  });

  it("escapes line separators so the payload is safe to inject as JS", () => {
    const marker = { id: 1, kind: "incident", latitude: 1, longitude: 2, color: "#000", title: "a" + String.fromCharCode(0x2028) + "b" };
    const json = serializePayload(buildPayload({ markers: [marker] }, false));
    expect(json.includes(String.fromCharCode(0x2028))).toBe(false);
    expect(JSON.parse(json).markers[0].title).toBe(marker.title);
  });

  it("parses map events and ignores junk", () => {
    expect(parseMapEvent('{"type":"ready"}')).toEqual({ type: "ready" });
    expect(parseMapEvent({ type: "pick", latitude: 1, longitude: 2 })).toEqual({ type: "pick", latitude: 1, longitude: 2 });
    expect(parseMapEvent("not json")).toBeNull();
    expect(parseMapEvent(null)).toBeNull();
  });
});
