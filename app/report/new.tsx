import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PressableView } from "@/components/pressable-view";
import { LocationField } from "@/components/location-field";
import { useDeviceLocation } from "@/hooks/use-device-location";
import { useCreateIssue, useIssue, useUpdateIssue } from "@/hooks/useApi";
import { resolveMediaUrl, uploadImage } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

const categories = ["Road Damage", "Streetlight", "Garbage / Illegal Dumping", "Water Leakage", "Waterlogging", "Power Outage", "Other"];

export default function NewReport() {
  const { C, s } = useAppStyles(makeStyles);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const createIssue = useCreateIssue();
  const device = useDeviceLocation();

  // Edit mode: /report/new?edit=<id> (the reporter can edit while the report is still "submitted")
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editId = Number(edit) || 0;
  const isEdit = editId > 0;
  const { data: editData } = useIssue(editId);
  const updateIssue = useUpdateIssue();
  // Photo already saved on the report being edited; imageUri holds a newly picked one
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const saving = createIssue.isPending || updateIssue.isPending;

  useEffect(() => {
    const issue = editData?.issue;
    // Fill the form once; the report query keeps polling and must not overwrite typing
    if (!isEdit || prefilled || !issue) return;
    setCategory(issue.category);
    setTitle(issue.title);
    setDescription(issue.description);
    setLandmark(issue.landmark ?? "");
    setSavedPhoto(issue.photoUrl ?? null);
    setPrefilled(true);
  }, [isEdit, prefilled, editData]);

  const previewUri = imageUri ?? (savedPhoto ? resolveMediaUrl(savedPhoto) : null);

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
      showAlert("Error", "Failed to pick image. Please try again.");
    }
  };

  const showImageOptions = () => {
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
    showAlert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setImageUri(null);
            setSavedPhoto(null);
          },
        },
      ],
    );
  };

  const submit = async () => {
    if (!category || !title.trim() || description.trim().length < 10) {
      return showAlert(
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
        if (isEdit) {
          return showAlert("Photo Upload Failed", err?.message || "Failed to upload photo. Please try again.");
        }
        showAlert(
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

    await (isEdit ? saveEdit(photoUrl) : submitIssue(photoUrl));
  };

  const saveEdit = async (newPhotoUrl: string | undefined) => {
    const original = editData?.issue;
    if (!original) return;
    // A new upload wins; otherwise the saved photo, or null if it was removed
    const photoUrl = newPhotoUrl ?? savedPhoto;
    try {
      setUploadProgress("Saving changes...");
      await updateIssue.mutateAsync({
        id: editId,
        data: {
          category,
          title: title.trim(),
          description: description.trim(),
          landmark: landmark.trim(),
          photoUrl: photoUrl !== (original.photoUrl ?? null) ? photoUrl : undefined,
        },
      });
      showAlert("Report updated", "Your changes have been saved.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err: any) {
      showAlert("Couldn't save changes", err?.message || "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
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
        latitude: device.coords?.latitude,
        longitude: device.coords?.longitude,
      });
      showAlert(
        "Report submitted",
        "Your report has been received by your ward.",
        [{ text: "View my reports", onPress: () => router.replace("/(tabs)/reports") }],
      );
    } catch (err: any) {
      showAlert(
        "Submission failed",
        err?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  if (isEdit && !prefilled) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={s.content}>
          <BackButton />
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.teal} />
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.content}>
        <BackButton />
        <Text style={s.title}>{isEdit ? "Edit report" : "Submit a report"}</Text>
        <Text style={s.subtitle}>
          {isEdit ? "You can change this until the ward team picks it up." : "Tell your ward team what needs attention."}
        </Text>
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
        
        {previewUri ? (
          <View style={s.imagePreviewContainer}>
            <Image source={{ uri: previewUri }} style={s.imagePreview} />
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
        {isEdit ? (
          <Text style={s.subtitle}>The location stays as it was when you reported it.</Text>
        ) : (
          <LocationField device={device} adjustable attachedText="Attached when you submit." />
        )}

        <PressableView
          onPress={submit}
          disabled={saving || uploading}
          style={[
            s.submit,
            (saving || uploading) && { opacity: 0.6 },
          ]}
          pressedStyle={{ opacity: 0.85 }}
        >
          {saving || uploading ? (
            <ActivityIndicator size="small" color={C.onFill} />
          ) : (
            <IconSymbol name="paperplane.fill" size={18} color={C.onFill} />
          )}
          <Text style={s.submitText}>
            {uploading
              ? uploadProgress
              : saving
                ? isEdit ? "Saving..." : "Submitting..."
                : isEdit ? "Save changes" : "Submit report"}
          </Text>
        </PressableView>
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  content: { paddingTop: 17, paddingBottom: 32 },
  title: { color: C.ink, fontSize: 29, fontWeight: "700" },
  subtitle: { color: C.muted, fontSize: 14, marginTop: 6, marginBottom: 25 },
  label: { color: C.ink, fontSize: 14, fontWeight: "700", marginBottom: 9, marginTop: 13 },
  optional: { color: C.muted, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: C.surface },
  chipActive: { backgroundColor: C.tealTintStrong, borderColor: C.teal },
  chipText: { color: C.muted, fontSize: 12, fontWeight: "600" },
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
  submit: { backgroundColor: C.tealFill, height: 46, borderRadius: 14, marginTop: 21, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, ...C.tealGlow },
  submitText: { color: C.onFill, fontSize: 15, fontWeight: "700" },
});