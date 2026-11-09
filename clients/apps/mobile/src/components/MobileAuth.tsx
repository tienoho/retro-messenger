import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface MobileAuthProps {
  username: string;
  password: string;
  busy: boolean;
  error: string | null;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onSelectDemo: (user: string, pass: string) => void;
}

export function MobileAuth({
  username,
  password,
  busy,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onSelectDemo,
}: MobileAuthProps) {
  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={styles.authPanel}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>R!</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Retro! Messenger</Text>
            <Text style={styles.authCopy}>Yahoo! Messenger Remastered</Text>
          </View>
        </View>

        <View style={styles.demoRow}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => onSelectDemo("honganh", "RetroPass123!")}
          >
            <Text style={styles.demoButtonText}>Demo: honganh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => onSelectDemo("hoangnam", "RetroPass123!")}
          >
            <Text style={styles.demoButtonText}>Demo: hoangnam</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          autoCapitalize="none"
          autoComplete="username"
          placeholder="Yahoo! ID / Tên đăng nhập"
          placeholderTextColor="#887799"
          style={styles.authInput}
          value={username}
          onChangeText={onUsernameChange}
        />
        <TextInput
          autoComplete="password"
          placeholder="Mật khẩu"
          placeholderTextColor="#887799"
          secureTextEntry
          style={styles.authInput}
          value={password}
          onChangeText={onPasswordChange}
          onSubmitEditing={onSubmit}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          style={[styles.primaryButton, busy && styles.disabled]}
          onPress={onSubmit}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? "Đang kết nối…" : "Đăng nhập Yahoo!"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#200833",
  },
  authPanel: {
    gap: 12,
    padding: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#5b1e84",
    backgroundColor: "#ede7f6",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#fed633",
    alignItems: "center",
    justifyContent: "center",
  },
  brandBadgeText: {
    color: "#3a1154",
    fontSize: 22,
    fontWeight: "900",
  },
  brandTitle: {
    color: "#3a1154",
    fontSize: 20,
    fontWeight: "800",
  },
  authCopy: { color: "#665577", fontSize: 11 },
  demoRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  demoButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#7f9db9",
    borderRadius: 3,
  },
  demoButtonText: {
    fontSize: 11,
    color: "#5b1e84",
    fontWeight: "600",
  },
  authInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#7f9db9",
    borderRadius: 3,
    backgroundColor: "#ffffff",
    color: "#111111",
    fontSize: 13,
  },
  primaryButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 3,
    backgroundColor: "#5b1e84",
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "800", fontSize: 14 },
  disabled: { opacity: 0.5 },
  error: { color: "#cc0000", fontSize: 12 },
});

