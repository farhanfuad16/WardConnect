import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LeafletMap } from "@/components/leaflet-map";
import { toCoords } from "@/lib/geo";
import { openDirections } from "@/lib/directions";
import { useIncident, useVolunteerCount, useVolunteers, useSubmitVolunteerInterest, useDeleteVolunteerInterest } from "@/hooks/useApi";
import { useAppColors } from "@/hooks/use-app-colors";
import { showAlert } from "@/lib/alert";

export default function IncidentDetail() {
  const C = useAppColors();
  const s = makeStyles(C);
  const { id } = useLocalSearchParams<{ id: string }>();
  const incidentId = parseInt(id || "0", 10);
  const { data, isLoading, error } = useIncident(incidentId);
  const volunteerMutation = useSubmitVolunteerInterest();
  const cancelMutation = useDeleteVolunteerInterest();
  const item = data?.incident;
  const { data: volunteerCountData } = useVolunteerCount(item?.wardId);
  const volunteerCount = volunteerCountData?.count ?? 0;

  // Volunteers aren't linked to a specific incident in the data model
  // (they're a ward-general pool an admin coordinates manually) — so "am I
  // already helping here" means "do I have a live signup for this incident's
  // ward", regardless of whether it came from this screen or the profile tab.
  const { data: myVolunteersData } = useVolunteers();
  const myRecord = myVolunteersData?.volunteers.find(
    (v) => v.wardId === item?.wardId && v.status !== "inactive",
  );
  const isPending = myRecord?.status === "pending";
  const isBusy = volunteerMutation.isPending || cancelMutation.isPending;

  const handleVolunteer = async () => {
    try {
      await volunteerMutation.mutateAsync({
        wardId: item?.wardId,
        skillsOrInterest: item ? `Wants to help with incident #${item.id}: "${item.title}"` : undefined,
      });
      showAlert("I can help", "Your volunteer offer has been recorded for manual coordination by the ward admin.");
    } catch (err: any) {
      showAlert("Couldn't record your offer", err?.message || "Something went wrong. Please try again.");
    }
  };

  const handleCancel = () => {
    if (!myRecord) return;
    showAlert("Cancel your offer?", "You'll no longer be listed as a volunteer for this ward.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel offer",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelMutation.mutateAsync(myRecord.id);
          } catch (err: any) {
            showAlert("Couldn't cancel your offer", err?.message || "Something went wrong. Please try again.");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={s.content}>
          <BackButton label="Back to map" />
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={{ color: C.muted, marginTop: 12 }}>Loading incident...</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (error || !item) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={s.content}>
          <BackButton label="Back to map" />
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Incident not found</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>{error?.message || "This incident could not be loaded."}</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const location = item.wardName || "Ward area";
  const coords = toCoords(item.latitude, item.longitude);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.content}>
        <BackButton label="Back to map" />
        <View style={s.badge}>
          <Text style={s.badgeText}>VERIFIED PUBLIC INCIDENT</Text>
        </View>
        <Text style={s.title}>{item.title}</Text>
        <Text style={s.location}>
          <IconSymbol name="location.fill" size={15} color={C.teal} /> {location}
        </Text>
        <View style={s.grid}>
          <View style={s.stat}><Text style={s.statLabel}>Category</Text><Text style={s.statValue}>{item.category}</Text></View>
          <View style={s.stat}><Text style={s.statLabel}>Severity</Text><Text style={s.statValue}>{item.severity}</Text></View>
          <View style={s.stat}><Text style={s.statLabel}>Status</Text><Text style={s.statValue}>{item.status}</Text></View>
        </View>
        <View style={s.volunteers}>
          <IconSymbol name="checkmark.circle.fill" size={18} color={C.teal} />
          <Text style={s.volunteersText}>
            <Text style={{ fontWeight: "700", color: C.ink }}>{volunteerCount}</Text> volunteer{volunteerCount === 1 ? "" : "s"} already helping in this ward
          </Text>
        </View>
        <Text style={s.section}>What we know</Text>
        <View style={s.card}>
          <Text style={s.body}>{item.description}</Text>
        </View>
        {coords ? (
          <>
            <Text style={s.section}>Where</Text>
            <LeafletMap height={190} pin={coords} view={{ ...coords, zoom: 16 }} />
            <Pressable onPress={() => openDirections(coords)} style={s.directions}>
              <IconSymbol name="arrow.triangle.turn.up.right.diamond.fill" size={18} color={C.teal} />
              <Text style={s.directionsText}>Get directions</Text>
            </Pressable>
          </>
        ) : null}
        <Text style={s.section}>Response timeline</Text>
        <View style={s.card}>
          <View style={s.timeline}><View style={s.timelineDot} /><View style={{ flex: 1 }}><Text style={s.timelineLabel}>Reported</Text><Text style={s.timelineTime}>Pending update</Text></View><View style={s.timelineLine} /></View>
          <View style={s.timeline}><View style={s.timelineDot} /><View style={{ flex: 1 }}><Text style={s.timelineLabel}>Verified by Ward Admin</Text><Text style={s.timelineTime}>Pending update</Text></View><View style={s.timelineLine} /></View>
          <View style={s.timeline}><View style={s.timelineDot} /><View style={{ flex: 1 }}><Text style={s.timelineLabel}>Response started</Text><Text style={s.timelineTime}>Pending update</Text></View></View>
        </View>
        {myRecord ? (
          <>
            <Pressable
              onPress={handleCancel}
              disabled={isBusy}
              style={[s.helping, isBusy && { opacity: 0.6 }]}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color={C.teal} />
              ) : (
                <IconSymbol name="checkmark.circle.fill" size={20} color={C.teal} />
              )}
              <Text style={s.helpingText}>{isPending ? "Offer pending — tap to cancel" : "You're helping — tap to cancel"}</Text>
            </Pressable>
            <Text style={s.helpNote}>
              {isPending ? "Your offer is waiting on ward admin approval." : "You're on the helper list for this ward."}
            </Text>
          </>
        ) : (
          <>
            <Pressable
              onPress={handleVolunteer}
              disabled={isBusy}
              style={[s.help, isBusy && { opacity: 0.6 }]}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color={C.onColor} />
              ) : (
                <IconSymbol name="checkmark.circle.fill" size={20} color={C.onColor} />
              )}
              <Text style={s.helpText}>I can help</Text>
            </Pressable>
            <Text style={s.helpNote}>Offer transport, shelter, supplies, or medical assistance.</Text>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function makeStyles(C: ReturnType<typeof useAppColors>) {
  return StyleSheet.create({
    content: { paddingTop: 17, paddingBottom: 32 },
    badge: { alignSelf: "flex-start", backgroundColor: C.coralTint, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
    badgeText: { color: C.coral, fontSize: 10, fontWeight: "600", letterSpacing: .6 },
    title: { color: C.ink, fontSize: 28, fontWeight: "700", lineHeight: 34, marginTop: 13 },
    location: { color: C.teal, fontSize: 13, fontWeight: "600", marginTop: 9, flexDirection: "row" },
    grid: { flexDirection: "row", gap: 8, marginTop: 22 },
    stat: { flex: 1, backgroundColor: C.surface, borderRadius: 13, padding: 11, ...C.card },
    statLabel: { color: C.muted, fontSize: 10 },
    statValue: { color: C.ink, fontSize: 12, fontWeight: "700", marginTop: 5 },
    volunteers: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.greenTint, borderRadius: 13, padding: 12, marginTop: 10 },
    volunteersText: { flex: 1, color: C.green, fontSize: 12.5, lineHeight: 18 },
    section: { color: C.ink, fontSize: 17, fontWeight: "700", marginTop: 25, marginBottom: 10 },
    card: { backgroundColor: C.surface, borderRadius: 16, padding: 15, ...C.card },
    body: { color: C.muted, fontSize: 14, lineHeight: 21 },
    timeline: { flexDirection: "row", alignItems: "flex-start", gap: 11, minHeight: 55, position: "relative" },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.teal, marginTop: 3 },
    timelineLine: { position: "absolute", left: 5, top: 16, height: 38, width: 2, backgroundColor: C.border },
    timelineLabel: { color: C.ink, fontSize: 13, fontWeight: "700" },
    timelineTime: { color: C.muted, fontSize: 11, marginTop: 3 },
    help: { height: 52, backgroundColor: C.teal, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 23, ...C.tealGlow },
    helpText: { color: C.onColor, fontSize: 15, fontWeight: "700" },
    helping: { height: 52, backgroundColor: C.tealTint, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 23, borderWidth: 1.5, borderColor: C.teal },
    helpingText: { color: C.teal, fontSize: 15, fontWeight: "700" },
    directions: { height: 46, backgroundColor: C.tealTint, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
    directionsText: { color: C.teal, fontSize: 14, fontWeight: "700" },
    helpNote: { color: C.muted, textAlign: "center", fontSize: 11, marginTop: 10 },
  });
}
