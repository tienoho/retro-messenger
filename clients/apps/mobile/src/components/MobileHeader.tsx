import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SessionDto } from "@retro/contracts";

export interface MobileHeaderProps {
  session: SessionDto;
  busy: boolean;
  onLogout: () => void;
  onStartCall?: (() => void) | undefined;
}

export function MobileHeader({
  session,
  busy,
  onLogout,
  onStartCall,
}: MobileHeaderProps) {
  const getStatusDot = (status: string) => {
    switch (status) {
      case "online":
        return "● Trực tuyến";
      case "busy":
        return "● Bận";
      case "away":
        return "● Vắng mặt";
      default:
        return "○ Ẩn";
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>Y!</Text>
        </View>
        <Text style={styles.brandTitle}>Yahoo! Messenger</Text>
      </View>

      <View style={styles.headerProfileRow}>
        <View style={styles.profileLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session.user.displayName.charAt(0).toUpperCase() || "Y"}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.title} numberOfLines={1}>
              {session.user.displayName}
            </Text>
            {session.user.customStatus ? (
              <Text style={styles.customStatus} numberOfLines={1}>
                &ldquo;{session.user.customStatus}&rdquo;
              </Text>
            ) : null}
            <Text style={styles.status}>
              {getStatusDot(session.user.status)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {onStartCall && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.callButton}
              onPress={onStartCall}
            >
              <Text style={styles.callButtonText}>Gọi</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            style={styles.logoutButton}
            onPress={onLogout}
          >
            <Text style={styles.logoutText}>Thoát</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#5b1e84",
    borderBottomWidth: 2,
    borderBottomColor: "#3a1154",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
  },
  logoBadge: {
    backgroundColor: "#fed633",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  logoText: {
    color: "#5b1e84",
    fontWeight: "900",
    fontSize: 11,
  },
  brandTitle: {
    color: "#fed633",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headerProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 4,
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
  infoCol: {
    flex: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  customStatus: {
    color: "#fed633",
    fontSize: 11,
    fontStyle: "italic",
  },
  status: {
    color: "#d8b4fe",
    fontSize: 10,
    marginTop: 1,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callButton: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#14532d",
  },
  callButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 11,
  },
  logoutButton: {
    backgroundColor: "#3a1154",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#260b38",
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 11,
  },
});
