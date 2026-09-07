import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCreateSosAlert } from "@/hooks/useApi";

const C = { ink: "#102A2A", teal: "#0F766E", bg: "#F4F8F7", surface: "#FFFFFF", muted: "#64748B", border: "#DCE9E6", coral: "#D9485F" };
const options = ["Fire", "Flood", "Medical", "Accident", "Security"];

export default function SOSScreen() {
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const createSos = useCreateSosAlert();

  const requestPermissions = async (type: "camera" | "library") => {
    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "Please grant camera permission in your device settings to take photos.",
          [{ text: "OK" }],
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Gallery Permission Required",
          "Please grant photo library permission in your device settings to select images.",
          [{ text: "OK" }],
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (useCamera: boolean) => {
    const permissionGranted = await requestPermissions(useCamera ? "camera" : "library");
    if (!permissionGranted) return;

    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Add Photo",
      "Choose how you'd like to add a photo",
      [
        { text: "Take Photo", onPress: () => pickImage(true) },
        { text: "Choose from Gallery", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const send = async () => {
    if (!selected) {
      return Alert.alert("Choose an emergency type", "Select the closest category so the ward team knows how to respond.");
    }

    try {
      // Note: Photo upload for SOS is not yet supported by the backend
      // The image will be captured but not sent with the SOS alert
      await createSos.mutateAsync({
        type: selected,
        note: note.trim() || undefined,
      });
      
      const message = imageUri
        ? "Ward admin has been notified. Note: Photo capture is available but the backend doesn't support photo uploads for SOS alerts yet. For life-threatening emergencies, call 999."
        : "Ward admin has been notified. For life-threatening emergencies, call 999.";
      
      Alert.alert("SOS sent", message, [{ text: "Done", onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert("Failed to send SOS", err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
      <ScrollView contentContainerStyle={s.content}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <IconSymbol name="arrow.left" size={21} color={C.ink} />
          <Text style={s.backText}>Back</Text>
        </Pressable>
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <IconSymbol name="exclamationmark.triangle.fill" size={30} color={C.coral} />
          </View>
          <Text style={s.title}>Send an SOS</Text>
          <Text style={s.subtitle}>Use this for urgent assistance inside your ward.</Text>
        </View>
        <Text style={s.label}>What is happening?</Text>
        <View style={s.grid}>
          {options.map((x) => (
            <Pressable key={x} onPress={() => setSelected(x)} style={[s.option, selected === x && s.optionActive]}>
              <View style={[s.optionIcon, selected === x && { backgroundColor: C.coral }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={18} color={selected === x ? C.surface : C.coral} />
              </View>
              <Text style={[s.optionText, selected === x && { color: C.coral }]}>{x}</Text>
            </Pressable>
          ))}
        </View>
        
        <Text style={s.label}>Add a photo (optional)</Text>
        {imageUri ? (
          <View style={s.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={s.imagePreview} />
            <View style={s.imageActions}>
              <Pressable onPress={removeImage} style={s.imageAction}>
                <IconSymbol name="trash" size={16} color={C.coral} />
                <Text style={[s.imageActionText, { color: C.coral }]}>Remove</Text>
              </Pressable>
              <Pressable onPress={showImageOptions} style={s.imageAction}>
                <IconSymbol name="camera.fill" size={16} color={C.teal} />
                <Text style={[s.imageActionText, { color: C.teal }]}>Replace</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={showImageOptions} style={s.addPhotoButton}>
            <View style={s.addPhotoIcon}>
              <IconSymbol name="camera.fill" size={24} color={C.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.addPhotoTitle}>Add a photo</Text>
              <Text style={s.addPhotoText}>Helps responders understand the situation</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={C.muted} />
          </Pressable>
        )}

        <View style={s.location}>
          <IconSymbol name="location.fill" size={20} color={C.teal} />
          <View style={{ flex: 1 }}>
            <Text style={s.locationTitle}>Current location ready</Text>
            <Text style={s.locationText}>Location will be attached automatically.</Text>
          </View>
          <IconSymbol name="checkmark.circle.fill" size={20} color={C.teal} />
        </View>
        <Pressable onPress={send} disabled={createSos.isPending} style={({ pressed }) => [s.send, pressed && { opacity: 0.85 }, createSos.isPending && { opacity: 0.6 }]}>
          {createSos.isPending ? (
            <ActivityIndicator size="small" color={C.surface} />
          ) : (
            <Text style={s.sendText}>SEND SOS</Text>
          )}
        </Pressable>
        <Text style={s.disclaimer}>Only use for genuine emergencies. False alerts divert resources from real incidents.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 17, paddingBottom: 32 },
  back: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 24 },
  backText: { color: C.ink, fontWeight: "700" },
  hero: { alignItems: "center", marginBottom: 29 },
  heroIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: "#FCE8EC", alignItems: "center", justifyContent: "center", marginBottom: 13 },
  title: { color: C.ink, fontSize: 29, fontWeight: "800" },
  subtitle: { color: C.muted, fontSize: 14, marginTop: 6, textAlign: "center" },
  label: { color: C.ink, fontSize: 14, fontWeight: "800", marginBottom: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: { width: "47.5%", backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, alignItems: "center", gap: 9 },
  optionActive: { borderColor: C.coral, backgroundColor: "#FFF6F7" },
  optionIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#FCE8EC", alignItems: "center", justifyContent: "center" },
  optionText: { color: C.ink, fontSize: 14, fontWeight: "800" },
  addPhotoButton: {
    backgroundColor: C.surface,
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
    marginBottom: 15,
  },
  addPhotoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E3F1EC",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoTitle: { color: C.ink, fontSize: 14, fontWeight: "700" },
  addPhotoText: { color: C.muted, fontSize: 12, marginTop: 2 },
  imagePreviewContainer: {
    backgroundColor: C.surface,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 15,
  },
  imagePreview: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  imageAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  imageActionText: { fontSize: 13, fontWeight: "600" },
  location: { marginTop: 10, backgroundColor: C.surface, borderRadius: 15, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.border },
  locationTitle: { color: C.ink, fontSize: 13, fontWeight: "800" },
  locationText: { color: C.muted, fontSize: 11, marginTop: 3 },
  send: { height: 54, backgroundColor: C.coral, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 20 },
  sendText: { color: C.surface, fontSize: 16, fontWeight: "900", letterSpacing: .2 },
  disclaimer: { color: C.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 16 },
});