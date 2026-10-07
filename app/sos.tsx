import { useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PressableView } from "@/components/pressable-view";
import { LocationField } from "@/components/location-field";
import { useDeviceLocation } from "@/hooks/use-device-location";
import { useCreateSosAlert } from "@/hooks/useApi";
import { showAlert } from "@/lib/alert";
import { uploadImage } from "@/lib/api";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

const options = ["Fire", "Flood", "Medical", "Accident", "Security"];

export default function SOSScreen() {
  const { C, s } = useAppStyles(makeStyles);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const createSos = useCreateSosAlert();
  const [uploading, setUploading] = useState(false);
  const device = useDeviceLocation();

  const requestPermissions = async (type: "camera" | "library") => {
    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Camera Permission Required",
          "Please grant camera permission in your device settings to take photos.",
          [{ text: "OK" }],
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
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
      showAlert("Error", "Failed to pick image. Please try again.");
    }
  };

  const showImageOptions = () => {
    // Web: showAlert can only offer two choices there (window.confirm), so
    // "Choose from Gallery" was unreachable. The browser's own file picker
    // already offers both camera and gallery on phones, so open it directly.
    if (Platform.OS === "web") return pickImage(false);
    showAlert(
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
      return showAlert("Choose an emergency type", "Select the closest category so the ward team knows how to respond.");
    }

    // A photo helps responders, but must never stop the SOS: if the upload
    // fails, send the alert without it.
    let photoUrl: string | undefined;
    let photoFailed = false;
    if (imageUri) {
      setUploading(true);
      try {
        photoUrl = (await uploadImage(imageUri)).url;
      } catch {
        photoFailed = true;
      } finally {
        setUploading(false);
      }
    }

    try {
      await createSos.mutateAsync({
        type: selected,
        note: note.trim() || undefined,
        photoUrl,
        latitude: device.coords?.latitude,
        longitude: device.coords?.longitude,
      });

      const message = photoFailed
        ? "Ward admin has been notified, but the photo couldn't be uploaded. For life-threatening emergencies, call 999."
        : "Ward admin has been notified. For life-threatening emergencies, call 999.";

      showAlert("SOS sent", message, [{ text: "Done", onPress: () => router.back() }]);
    } catch (err: any) {
      showAlert("Failed to send SOS", err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.content}>
        <BackButton />
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
              <View style={[s.optionIcon, selected === x && { backgroundColor: C.coralFill }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={18} color={selected === x ? C.onFill : C.coral} />
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

        <View style={{ marginTop: 10 }}>
          <LocationField device={device} adjustable attachedText="Sent with your alert so responders can find you." />
        </View>
        <PressableView onPress={send} disabled={createSos.isPending || uploading} style={[s.send, (createSos.isPending || uploading) && { opacity: 0.6 }]} pressedStyle={{ opacity: 0.85 }}>
          {createSos.isPending || uploading ? (
            <ActivityIndicator size="small" color={C.onFill} />
          ) : (
            <Text style={s.sendText}>SEND SOS</Text>
          )}
        </PressableView>
        <Text style={s.disclaimer}>Only use for genuine emergencies. False alerts divert resources from real incidents.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  content: { paddingTop: 17, paddingBottom: 32 },
  hero: { alignItems: "center", marginBottom: 29 },
  heroIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: C.coralTint, alignItems: "center", justifyContent: "center", marginBottom: 13 },
  title: { color: C.ink, fontSize: 29, fontWeight: "700" },
  subtitle: { color: C.muted, fontSize: 14, marginTop: 6, textAlign: "center" },
  label: { color: C.ink, fontSize: 14, fontWeight: "700", marginBottom: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: { width: "47.5%", backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, alignItems: "center", gap: 9 },
  optionActive: { borderColor: C.coralFill, backgroundColor: C.coralSelectedBg },
  optionIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.coralTint, alignItems: "center", justifyContent: "center" },
  optionText: { color: C.ink, fontSize: 14, fontWeight: "700" },
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
    backgroundColor: C.tealTint,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoTitle: { color: C.ink, fontSize: 14, fontWeight: "600" },
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
  send: { height: 46, backgroundColor: C.coralFill, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 20, ...C.coralGlow },
  sendText: { color: C.onFill, fontSize: 15, fontWeight: "600", letterSpacing: .2 },
  disclaimer: { color: C.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 16 },
});