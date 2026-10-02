import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useAppColors } from "@/hooks/use-app-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  LEAFLET_HTML,
  buildPayload,
  parseMapEvent,
  serializePayload,
  type LeafletMapProps,
} from "@/lib/leaflet-html";

// OpenStreetMap's tile servers want a Referer; a real-looking base URL gives
// the WebView one.
const SOURCE = { html: LEAFLET_HTML, baseUrl: "https://wardconnect.app" };

export function LeafletMap(props: LeafletMapProps) {
  const C = useAppColors();
  const dark = useColorScheme() === "dark";
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const { onMarkerPress, onPinChange } = props;

  const json = useMemo(
    () => serializePayload(buildPayload(props, dark)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.markers, props.userLocation, props.pin, props.view, props.viewKey, !!props.onPinChange, dark],
  );

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.setData(${json});true;`);
  }, [ready, json]);

  const onMessage = (e: WebViewMessageEvent) => {
    const ev = parseMapEvent(e.nativeEvent.data);
    if (!ev) return;
    if (ev.type === "ready") setReady(true);
    else if (ev.type === "select") onMarkerPress?.({ kind: ev.kind, id: Number(ev.id) });
    else if (ev.type === "pick") onPinChange?.({ latitude: ev.latitude, longitude: ev.longitude });
  };

  return (
    <View style={[styles.box, { height: props.height ?? 210, backgroundColor: C.mapBg, borderColor: C.border }]}>
      <WebView
        ref={ref}
        source={SOURCE}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onMessage={onMessage}
        // The page reloads if the WebView process is killed; wait for its new "ready".
        onLoadStart={() => setReady(false)}
        nestedScrollEnabled
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 19, overflow: "hidden", borderWidth: 1 },
  web: { flex: 1, backgroundColor: "transparent" },
});
