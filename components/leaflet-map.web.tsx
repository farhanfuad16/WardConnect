import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useAppColors } from "@/hooks/use-app-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  LEAFLET_HTML,
  buildPayload,
  parseMapEvent,
  type LeafletMapProps,
} from "@/lib/leaflet-html";

export function LeafletMap(props: LeafletMapProps) {
  const C = useAppColors();
  const dark = useColorScheme() === "dark";
  const frame = useRef<HTMLIFrameElement | null>(null);
  // Bumped on every "ready" from the page, so a reloaded iframe gets its data again.
  const [readyCount, setReadyCount] = useState(0);

  const payload = useMemo(
    () => buildPayload(props, dark),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.markers, props.userLocation, props.pin, props.view, props.viewKey, !!props.onPinChange, dark],
  );

  // Latest callbacks without re-subscribing the message listener.
  const handlers = useRef({ onMarkerPress: props.onMarkerPress, onPinChange: props.onPinChange });
  handlers.current = { onMarkerPress: props.onMarkerPress, onPinChange: props.onPinChange };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const ev = parseMapEvent(e.data?.wc);
      if (!ev) return;
      if (ev.type === "ready") setReadyCount((n) => n + 1);
      else if (ev.type === "select") handlers.current.onMarkerPress?.({ kind: ev.kind, id: Number(ev.id) });
      else if (ev.type === "pick") handlers.current.onPinChange?.({ latitude: ev.latitude, longitude: ev.longitude });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (readyCount > 0) frame.current?.contentWindow?.postMessage({ wcSet: payload }, "*");
  }, [readyCount, payload]);

  return (
    <View style={[styles.box, { height: props.height ?? 210, backgroundColor: C.mapBg, borderColor: C.border }]}>
      {createElement("iframe", {
        ref: frame,
        srcDoc: LEAFLET_HTML,
        title: "Map",
        sandbox: "allow-scripts",
        style: { border: 0, width: "100%", height: "100%", display: "block" },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 19, overflow: "hidden", borderWidth: 1 },
});
