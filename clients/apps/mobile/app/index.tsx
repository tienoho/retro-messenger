import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { isRefreshTokenRejected, RetroApiClient } from "@retro/api-client";
import type { MessageDto, SessionDto } from "@retro/contracts";
import { secureTokenStore } from "../src/native/secure-storage";
import { MobileSessionController } from "../src/session/mobile-session";

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:5080";

export default function HomeScreen() {
  const api = useMemo(() => new RetroApiClient(apiUrl), []);
  const sessions = useMemo(
    () => new MobileSessionController(api, secureTokenStore),
    [api],
  );

  const [session, setSession] = useState<SessionDto | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (): Promise<void> => {
    const conversations = await api.listConversations();
    const first = conversations[0] ?? null;
    setConversationId(first?.id ?? null);
    setMessages(first ? await api.listMessages(first.id) : []);
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    void sessions
      .restore()
      .then(async (response) => {
        if (cancelled || !response) return;
        setSession({ user: response.user });
        await loadWorkspace();
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            isRefreshTokenRejected(caught)
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              : "Chưa thể kết nối. Phiên an toàn vẫn được giữ trên thiết bị.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadWorkspace, sessions]);

  useEffect(() => {
    if (!session) return;
    let refreshing = false;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || refreshing) return;
      refreshing = true;
      void sessions
        .refresh()
        .then(async (response) => {
          setSession({ user: response.user });
          await loadWorkspace();
          setError(null);
        })
        .catch((caught: unknown) => {
          if (isRefreshTokenRejected(caught)) {
            setSession(null);
            setConversationId(null);
            setMessages([]);
          }
          setError(
            isRefreshTokenRejected(caught)
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              : "Đang ngoại tuyến. Tin nhắn đã tải vẫn được giữ lại.",
          );
        })
        .finally(() => {
          refreshing = false;
        });
    });
    return () => subscription.remove();
  }, [loadWorkspace, session, sessions]);

  async function login(): Promise<void> {
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const response = await sessions.login(username.trim(), password);
      setSession({ user: response.user });
      setPassword("");
      await loadWorkspace();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể đăng nhập vào lúc này.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout(): Promise<void> {
    setBusy(true);
    try {
      await sessions.logout();
    } catch {
      // Secure storage is cleared by the controller even when the network fails.
    } finally {
      setSession(null);
      setConversationId(null);
      setMessages([]);
      setBusy(false);
    }
  }

  async function send(): Promise<void> {
    const content = draft.trim();
    if (!content || !conversationId) return;
    setDraft("");
    setError(null);
    try {
      const result = await api.sendMessage(
        conversationId,
        `${Date.now()}-${Math.random()}`,
        content,
      );
      setMessages((current) =>
        [...current, result.message].sort(
          (left, right) => left.sequence - right.sequence,
        ),
      );
    } catch (caught) {
      setDraft(content);
      setError(
        caught instanceof Error ? caught.message : "Không thể gửi tin nhắn.",
      );
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#6c3fd1" size="large" />
        <Text style={styles.muted}>Đang khôi phục phiên an toàn…</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authPanel}>
          <Text style={styles.brand}>R!</Text>
          <Text style={styles.authTitle}>Retro Messenger</Text>
          <Text style={styles.authCopy}>
            Refresh token chỉ được lưu trong Keychain hoặc Keystore của thiết
            bị.
          </Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="username"
            placeholder="Tên đăng nhập"
            style={styles.authInput}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            autoComplete="password"
            placeholder="Mật khẩu"
            secureTextEntry
            style={styles.authInput}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => void login()}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            style={[styles.primaryButton, busy && styles.disabled]}
            onPress={() => void login()}
          >
            <Text style={styles.primaryButtonText}>
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{session.user.displayName}</Text>
          <Text style={styles.status}>{session.user.status}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void logout()}
        >
          <Text style={styles.logout}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.workspaceError}>{error}</Text>}

      <FlashList
        data={messages}
        contentContainerStyle={styles.list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: MessageDto }) => {
          const mine = item.senderId === session.user.id;
          return (
            <View style={[styles.row, mine && styles.rowMine]}>
              <View style={[styles.bubble, mine && styles.bubbleMine]}>
                <Text style={mine && styles.textMine}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          editable={Boolean(conversationId)}
          placeholder={
            conversationId ? "Nhập tin nhắn…" : "Chưa có cuộc trò chuyện"
          }
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => void send()}
        />
        <TouchableOpacity
          accessibilityRole="button"
          disabled={!conversationId || !draft.trim()}
          style={[
            styles.send,
            (!conversationId || !draft.trim()) && styles.disabled,
          ]}
          onPress={() => void send()}
        >
          <Text style={styles.sendText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3f8" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f5f3f8",
  },
  muted: { color: "#6b6473" },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#24123f",
  },
  authPanel: {
    gap: 14,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#ffffff",
  },
  brand: { color: "#6c3fd1", fontSize: 32, fontWeight: "900" },
  authTitle: { color: "#2c2137", fontSize: 26, fontWeight: "800" },
  authCopy: { color: "#6b6473", lineHeight: 20 },
  authInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d9d2e3",
    borderRadius: 12,
    backgroundColor: "#faf8fc",
  },
  primaryButton: {
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#6c3fd1",
  },
  primaryButtonText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.5 },
  error: { color: "#b42318" },
  workspaceError: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: "#b42318",
    backgroundColor: "#fff1f0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#6c3fd1",
  },
  title: { color: "white", fontSize: 20, fontWeight: "700" },
  status: { color: "#ddffdf", textTransform: "capitalize" },
  logout: { color: "white", fontWeight: "700" },
  list: { padding: 14 },
  row: { flexDirection: "row", marginBottom: 8 },
  rowMine: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "white",
  },
  bubbleMine: { backgroundColor: "#6c3fd1" },
  textMine: { color: "white" },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
  },
  send: {
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#6c3fd1",
  },
  sendText: { color: "white", fontWeight: "700" },
});
