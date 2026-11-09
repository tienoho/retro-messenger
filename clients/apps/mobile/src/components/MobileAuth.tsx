import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface MobileAuthProps {
  mode?: "login" | "register";
  username: string;
  displayName?: string;
  password: string;
  confirmPassword?: string;
  busy: boolean;
  error: string | null;
  onModeChange?: (mode: "login" | "register") => void;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange?: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange?: (value: string) => void;
  onSubmit: () => void;
  onSelectDemo: (user: string, pass: string) => void;
}

export function MobileAuth({
  mode = "login",
  username,
  displayName = "",
  password,
  confirmPassword = "",
  busy,
  error,
  onModeChange,
  onUsernameChange,
  onDisplayNameChange,
  onPasswordChange,
  onConfirmPasswordChange,
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

        {onModeChange && (
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeTab, mode === "login" && styles.modeTabActive]}
              onPress={() => onModeChange("login")}
            >
              <Text style={[styles.modeTabText, mode === "login" && styles.modeTabTextActive]}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === "register" && styles.modeTabActive]}
              onPress={() => onModeChange("register")}
            >
              <Text style={[styles.modeTabText, mode === "register" && styles.modeTabTextActive]}>
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === "login" && (
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => onSelectDemo("honganh", "RetroPass123!")}
            >
              <Text style={styles.demoButtonText}>honganh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => onSelectDemo("hoangnam", "RetroPass123!")}
            >
              <Text style={styles.demoButtonText}>hoangnam</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => onSelectDemo("retro_tester", "RetroPass123!")}
            >
              <Text style={styles.demoButtonText}>retro_tester</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === "register" && onDisplayNameChange && (
          <TextInput
            autoCapitalize="words"
            autoComplete="name"
            placeholder="Tên hiển thị (Nickname)"
            placeholderTextColor="#887799"
            style={styles.authInput}
            value={displayName}
            onChangeText={onDisplayNameChange}
          />
        )}

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
          autoComplete={mode === "login" ? "password" : "new-password"}
          placeholder="Mật khẩu"
          placeholderTextColor="#887799"
          secureTextEntry
          style={styles.authInput}
          value={password}
          onChangeText={onPasswordChange}
          onSubmitEditing={onSubmit}
        />

        {mode === "register" && onConfirmPasswordChange && (
          <TextInput
            autoComplete="new-password"
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#887799"
            secureTextEntry
            style={styles.authInput}
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
            onSubmitEditing={onSubmit}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          style={[styles.primaryButton, busy && styles.disabled]}
          onPress={onSubmit}
        >
          <Text style={styles.primaryButtonText}>
            {busy
              ? "Đang kết nối…"
              : mode === "login"
                ? "Đăng nhập Yahoo!"
                : "Tạo tài khoản Yahoo!"}
          </Text>
        </TouchableOpacity>

        {onModeChange && (
          <TouchableOpacity
            style={styles.togglePrompt}
            onPress={() => onModeChange(mode === "login" ? "register" : "login")}
          >
            <Text style={styles.togglePromptText}>
              {mode === "login"
                ? "Chưa có tài khoản Yahoo? Đăng ký ngay"
                : "Đã có tài khoản? Quay lại đăng nhập"}
            </Text>
          </TouchableOpacity>
        )}
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
  modeToggleRow: {
    flexDirection: "row",
    backgroundColor: "#dcd1ed",
    borderRadius: 16,
    padding: 2,
    marginVertical: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 14,
  },
  modeTabActive: {
    backgroundColor: "#5b1e84",
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5b1e84",
  },
  modeTabTextActive: {
    color: "#ffffff",
  },
  togglePrompt: {
    alignItems: "center",
    marginTop: 6,
  },
  togglePromptText: {
    color: "#5b1e84",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

