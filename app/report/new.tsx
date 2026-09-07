import { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCreateIssue } from "@/hooks/useApi";
import { uploadImage } from "@/lib/api";

const C = { ink: "#102A2A", teal: "#0F766E", bg: "#F4F8F7", surface: "#FFFFFF", muted: "#64748B", border: "#DCE9E6", coral: "#D9485F" };
const categories = ["Road Damage", "Streetlight", "Garbage / Illegal Dumping", "Water Leakage", "Waterlogging", "Power Outage", "Other"];

export default function NewReport() {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const createIssue = useCreateIssue();

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
            quality: 0.7, // Compress to 70% quality
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7, // Compress to 70% quality
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
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => setImageUri(null) },
      ],
    );
  };

  const submit = async () => {
    if (!category || !title.trim() || description.trim().length < 10) {
      return Alert.alert(
        "Add a little more detail",
        "Choose a category, enter a title, and write at least 10 characters so the ward team can act.",
      );
    }

    let photoUrl: string | undefined;

    // Upload image if selected
    if (imageUri) {
      try {
        setUploading(true);
        setUploadProgress("Uploading photo...");
        const uploadResult = await uploadImage(imageUri);
        photoUrl = uploadResult.url;
      } catch (err: any) {
        setUploading(false);
        Alert.alert(
          "Photo Upload Failed",
          err?.message || "Failed to upload photo. Would you like to submit without a photo?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Submit Without Photo",
              onPress: () => submitIssue(undefined),
            },
          ],
        );
        return;
      }
    }

    await submitIssue(photoUrl);
  };

  const submitIssue = async (photoUrl: string | undefined) => {
    try {
      setUploadProgress("Submitting report...");
      await createIssue.mutateAsync({
        category,
        title: title.trim(),
        description: description.trim(),
        landmark: landmark.trim() || undefined,
        photoUrl,
      });
      Alert.alert(
        "Report submitted",
        "Your report has been received by your ward.",
        [{ text: "View my reports", onPress: () => router.replace("/(tabs)/reports") }],
      );
    } catch (err: any) {
      Alert.alert(
        "Submission failed",
        err?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
      <ScrollView contentContainerStyle={s.content}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <IconSymbol name="arrow.left" size={21} color={C.ink} />
          <Text style={s.backText}>Back</Text>
        </Pressable>
        <Text style={s.title}>Submit a report</Text>
        <Text style={s.subtitle}>Tell your ward team what needs attention.</Text>
        <Text style={s.label}>Category</Text>
        <View style={s.chips}>
          {categories.map((x) => (
            <Pressable key={x} onPress={() => setCategory(x)} style={[s.chip, category === x && s.chipActive]}>
              <Text style={[s.chipText, category === x && s.chipTextActive]}>{x}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Brief title for the issue" placeholderTextColor={C.muted} style={s.input} />
        <Text style={s.label}>What happened?</Text>
        <TextInput multiline value={description} onChangeText={setDescription} placeholder="Describe the issue clearly" placeholderTextColor={C.muted} style={[s.input, s.textarea]} />
        <Text style={s.label}>Landmark <Text style={s.optional}>(optional)</Text></Text>
        <TextInput value={landmark} onChangeText={setLandmark} placeholder="e.g. Near Kafrul Market" placeholderTextColor={C.muted} style={s.input} />
        <Text style={s.label}>Photo <Text style={s.optional}>(optional)</Text></Text>
        
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
              <Text style={s.addPhotoText}>Helps the ward team understand the issue better</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={C.muted} />
          </Pressable>
        )}

        <Text style={s.label}>Location</Text>
        <View style={s.utility}>
          <View style={s.utilityIcon}>
            <IconSymbol name="location.fill" size={19} color={C.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.utilityTitle}>Location ready to share</Text>
            <Text style={s.utilityText}>Current location will be attached when you submit.</Text>
          </View>
        </View>
        
        <Pressable
          onPress={submit}
          disabled={createIssue.isPending || uploading}
          style={({ pressed }) => [
            s.submit,
            pressed && { opacity: 0.85 },
            (createIssue.isPending || uploading) && { opacity: 0.6 },
          ]}
        >
          {createIssue.isPending || uploading ? (
            <ActivityIndicator size="small" color={C.surface} />
          ) : (
            <IconSymbol name="paperplane.fill" size={19} color={C.surface} />
          )}
          <Text style={s.submitText}>
            {uploading
              ? uploadProgress
              : createIssue.isPending
                ? "Submitting..."
                : "Submit report"}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 17, paddingBottom: 32 },
  back: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 23 },
  backText: { color: C.ink, fontWeight: "700", fontSize: 14 },
  title: { color: C.ink, fontSize: 29, fontWeight: "800" },
  subtitle: { color: C.muted, fontSize: 14, marginTop: 6, marginBottom: 25 },
  label: { color: C.ink, fontSize: 14, fontWeight: "800", marginBottom: 9, marginTop: 13 },
  optional: { color: C.muted, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: C.surface },
  chipActive: { backgroundColor: "#D6EFEB", borderColor: C.teal },
  chipText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: C.teal },
  input: { height: 48, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 14, color: C.ink, fontSize: 14 },
  textarea: { height: 105, paddingTop: 13, textAlignVertical: "top" },
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
  },
  imagePreview: {
    width: "100%",
    height: 200,
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
  utility: { backgroundColor: C.surface, borderRadius: 15, padding: 13, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.border, marginBottom: 9 },
  utilityIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#E3F1EC", alignItems: "center", justifyContent: "center" },
  utilityTitle: { color: C.ink, fontSize: 13, fontWeight: "800" },
  utilityText: { color: C.muted, fontSize: 11, marginTop: 3 },
  submit: { backgroundColor: C.teal, height: 53, borderRadius: 16, marginTop: 21, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { color: C.surface, fontSize: 15, fontWeight: "800" },
});