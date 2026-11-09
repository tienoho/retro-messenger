import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SessionDto } from "@retro/contracts";

export interface MobileHeaderProps {
  session: SessionDto;
  busy: boolean;
  onLogout: () => void;
}

export function MobileHeader({ session, busy, onLogout }: MobileHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerProfile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {session.user.displayName.charAt(0).toUpperCase() || "Y"}
          </Text>
        </View>
        <View>
          <Text style={styles.title}>{session.user.displayName}</Text>
          <Text style={styles.status}>
            {session.user.status === "online" ? "● Trực tuyến" : "○ Ngoại tuyến"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        disabled={busy}
        onPress={onLogout}
      >
        <Text style={styles.logout}>Thoát</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#5b1e84",
    borderBottomWidth: 1,
    borderBottomColor: "#3a1154",
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fed633",
    borderWidth: 1.5,
    borderColor: "#c48200",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#5b1e84",
  },
  title: { color: "white", fontSize: 15, fontWeight: "700" },
  status: { color: "#fed633", fontSize: 11 },
  logout: { color: "white", fontWeight: "700", fontSize: 12 },
});

