import { DEFAULT_CENTER, type Coords } from "./geo"; // relative so plain-node tests can load this file

/**
 * Shared bits of the Leaflet + OpenStreetMap map. The map itself is a small
 * HTML page rendered in a WebView on native (components/leaflet-map.tsx) and
 * in an iframe on web (components/leaflet-map.web.tsx). It has no API key and
 * works in Expo Go. Data is pushed in with `window.setData(payload)` so the
 * page is loaded once and never reloads when markers change.
 */

export type MapMarker = {
  id: number | string;
  /** Free-form group name ("incident", "resource"), echoed back on press. */
  kind: string;
  latitude: number;
  longitude: number;
  color: string;
  /** Short text inside the pin. */
  label?: string;
  shape?: "circle" | "square";
  title: string;
  subtitle?: string;
  /** If set, the popup shows a link with this text that fires onMarkerPress. */
  action?: string;
};

export type MapView = { latitude: number; longitude: number; zoom?: number };

export type LeafletMapProps = {
  markers?: MapMarker[];
  userLocation?: Coords | null;
  /** A single draggable pin (e.g. "where is the problem?"). */
  pin?: Coords | null;
  /** When set, tapping the map / dragging the pin reports the new position. */
  onPinChange?: (c: Coords) => void;
  onMarkerPress?: (m: { kind: string; id: number }) => void;
  /** Centre on this point. Without it the map fits all markers. */
  view?: MapView;
  /** The view is re-applied only when this changes (so polling doesn't reset the user's pan/zoom). */
  viewKey?: string | number;
  height?: number;
};

export type MapPayload = {
  markers: MapMarker[];
  me: Coords | null;
  pin: Coords | null;
  pickable: boolean;
  view: MapView | null;
  viewKey: string | number;
  dark: boolean;
};

export function buildPayload(p: LeafletMapProps, dark: boolean): MapPayload {
  return {
    markers: p.markers ?? [],
    me: p.userLocation ?? null,
    pin: p.pin ?? null,
    pickable: !!p.onPinChange,
    view: p.view ?? null,
    viewKey: p.viewKey ?? 0,
    dark,
  };
}

/** JSON that is safe to embed in injected JS / postMessage. */
export function serializePayload(p: MapPayload): string {
  // U+2028/U+2029 are valid in JSON but terminate lines in JS source, so
  // spell them out as escapes before the string is injected into the page.
  const escape = (c: number) => String.fromCharCode(92) + "u" + c.toString(16);
  return JSON.stringify(p)
    .split(String.fromCharCode(0x2028)).join(escape(0x2028))
    .split(String.fromCharCode(0x2029)).join(escape(0x2029));
}

export type MapEvent =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "select"; kind: string; id: string }
  | { type: "pick"; latitude: number; longitude: number };

export function parseMapEvent(raw: unknown): MapEvent | null {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return v && typeof v === "object" && typeof (v as any).type === "string" ? (v as MapEvent) : null;
  } catch {
    return null;
  }
}

// Map tiles. Default is OpenStreetMap's own tile server: free, no key, but a
// plain style. Setting EXPO_PUBLIC_MAPTILER_KEY (free key from maptiler.com)
// switches to MapTiler's cleaner, Google-like "streets" style with a real dark
// variant. `{r}` becomes "@2x" on high-density screens.
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY || "";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const TILES = MAPTILER_KEY
  ? {
      light: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}{r}.png?key=${MAPTILER_KEY}`,
      dark: `https://api.maptiler.com/maps/streets-v2-dark/256/{z}/{x}/{y}{r}.png?key=${MAPTILER_KEY}`,
      attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>`,
      detectRetina: false,
      invertDark: false,
    }
  : {
      light: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      dark: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: OSM_ATTRIBUTION,
      // OSM has no @2x tiles; this loads the next zoom level's tiles instead so text stays crisp.
      detectRetina: true,
      invertDark: true,
    };

const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";

export const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="${LEAFLET_CSS}" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  body { background: #DDEAE4; font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif; }
  body.dark { background: #1E2628; }
  body.dark .leaflet-container { background: #1E2628; }
  ${TILES.invertDark ? "body.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9); }" : ""}
  .wc-pin { width: 26px; height: 26px; box-sizing: border-box; border: 3px solid #fff; border-radius: 50%;
    box-shadow: 0 1px 5px rgba(0,0,0,.4); color: #fff; font: 700 11px/20px system-ui, sans-serif; text-align: center; }
  .wc-pin.sq { border-radius: 8px; }
  .wc-drop { width: 22px; height: 22px; box-sizing: border-box; border: 3px solid #fff; border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg); background: #D9485F; box-shadow: 0 1px 5px rgba(0,0,0,.45); }
  .wc-pop { font-size: 13px; line-height: 1.35; }
  .wc-pop b { display: block; font-size: 14px; }
  .wc-pop span { color: #64748B; }
  .wc-link { display: inline-block; margin-top: 6px; color: #0F766E; font-weight: 700; cursor: pointer; }
  .wc-off { display: flex; height: 100%; align-items: center; justify-content: center; padding: 16px;
    text-align: center; color: #64748B; font-size: 13px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="${LEAFLET_JS}"></script>
<script>
(function () {
  function post(o) {
    var m = JSON.stringify(o);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m);
    else if (window.parent !== window) window.parent.postMessage({ wc: o }, '*');
  }
  if (typeof L === 'undefined') {
    document.getElementById('map').innerHTML = '<div class="wc-off">The map needs an internet connection.</div>';
    post({ type: 'error', message: 'Leaflet failed to load' });
    window.setData = function () {};
    return;
  }
  var DEFAULT = [${DEFAULT_CENTER.latitude}, ${DEFAULT_CENTER.longitude}];
  var map = L.map('map', { zoomControl: true }).setView(DEFAULT, 14);
  var TILE_OPTS = { maxZoom: 19, detectRetina: ${TILES.detectRetina}, attribution: '${TILES.attribution}' };
  var lightTiles = L.tileLayer('${TILES.light}', TILE_OPTS);
  var darkTiles = L.tileLayer('${TILES.dark}', TILE_OPTS);
  var tiles = null;
  function useTiles(dark) {
    var next = dark ? darkTiles : lightTiles;
    if (next === tiles) return;
    if (tiles) map.removeLayer(tiles);
    tiles = next.addTo(map);
  }
  useTiles(false);

  var group = L.layerGroup().addTo(map);
  var me = null, pin = null, pickable = false, lastViewKey = null;
  var dropIcon = L.divIcon({ className: '', html: '<div class="wc-drop"></div>', iconSize: [22, 22], iconAnchor: [11, 22] });

  var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return ENT[c]; });
  }

  function placePin(lat, lng, emit) {
    if (!pin) {
      pin = L.marker([lat, lng], { draggable: pickable, icon: dropIcon }).addTo(map);
      pin.on('dragend', function () {
        var p = pin.getLatLng();
        post({ type: 'pick', latitude: p.lat, longitude: p.lng });
      });
    } else {
      pin.setLatLng([lat, lng]);
    }
    if (pin.dragging) { if (pickable) pin.dragging.enable(); else pin.dragging.disable(); }
    if (emit) post({ type: 'pick', latitude: lat, longitude: lng });
  }

  map.on('click', function (e) { if (pickable) placePin(e.latlng.lat, e.latlng.lng, true); });
  map.on('popupopen', function (e) {
    var a = e.popup.getElement().querySelector('.wc-link');
    if (a) a.onclick = function () { post({ type: 'select', kind: a.getAttribute('data-k'), id: a.getAttribute('data-i') }); };
  });
  window.addEventListener('resize', function () { map.invalidateSize(); });

  window.setData = function (d) {
    document.body.className = d.dark ? 'dark' : '';
    useTiles(!!d.dark);
    pickable = !!d.pickable;

    group.clearLayers();
    var pts = [];
    (d.markers || []).forEach(function (m) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="wc-pin' + (m.shape === 'square' ? ' sq' : '') + '" style="background:' + esc(m.color) + '">' + esc(m.label || '') + '</div>',
        iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -13]
      });
      var html = '<div class="wc-pop"><b>' + esc(m.title) + '</b>';
      if (m.subtitle) html += '<span>' + esc(m.subtitle) + '</span>';
      if (m.action) html += '<br><a class="wc-link" data-k="' + esc(m.kind) + '" data-i="' + esc(m.id) + '">' + esc(m.action) + ' &rsaquo;</a>';
      html += '</div>';
      L.marker([m.latitude, m.longitude], { icon: icon }).bindPopup(html).addTo(group);
      pts.push([m.latitude, m.longitude]);
    });

    if (me) { map.removeLayer(me); me = null; }
    if (d.me) {
      me = L.circleMarker([d.me.latitude, d.me.longitude], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(map);
      pts.push([d.me.latitude, d.me.longitude]);
    }

    if (d.pin) { placePin(d.pin.latitude, d.pin.longitude, false); pts.push([d.pin.latitude, d.pin.longitude]); }
    else if (pin) { map.removeLayer(pin); pin = null; }

    if (d.viewKey !== lastViewKey) {
      lastViewKey = d.viewKey;
      if (d.view) map.setView([d.view.latitude, d.view.longitude], d.view.zoom || 15);
      else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [32, 32], maxZoom: 16 });
      else if (pts.length === 1) map.setView(pts[0], 15);
      else map.setView(DEFAULT, 14);
    }
  };

  // Web (iframe): the parent pushes data with postMessage.
  window.addEventListener('message', function (e) { if (e.data && e.data.wcSet) window.setData(e.data.wcSet); });
  post({ type: 'ready' });
})();
</script>
</body>
</html>`;
