import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MobileAuth } from "../src/components/MobileAuth";
import { MobileHeader } from "../src/components/MobileHeader";
import { MobileTranscript } from "../src/components/MobileTranscript";
import { MobileComposer } from "../src/components/MobileComposer";
import { useMobileChat } from "../src/hooks/useMobileChat";

export default function HomeScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const {
    session,
    conversationId,
    messages,
    draft,
    booting,
    busy,
    error,
    setDraft,
    login,
    logout,
    send,
  } = useMobileChat();

  if (booting) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#5b1e84" size="large" />
        <Text style={styles.muted}>Đang khôi phục phiên Yahoo Messenger…</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <MobileAuth
        username={username}
        password={password}
        busy={busy}
        error={error}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={() => void login(username, password)}
        onSelectDemo={(user, pass) => {
          setUsername(user);
          setPassword(pass);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MobileHeader
        session={session}
        busy={busy}
        onLogout={() => void logout()}
      />

      {error && <Text style={styles.workspaceError}>{error}</Text>}

      <MobileTranscript session={session} messages={messages} />

      <MobileComposer
        conversationId={conversationId}
        draft={draft}
        onDraftChange={setDraft}
        onSend={(custom) => void send(custom)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ede7f6" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#ede7f6",
  },
  muted: { color: "#5b1e84", fontSize: 13 },
  workspaceError: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    color: "#cc0000",
    backgroundColor: "#fff0f0",
    fontSize: 12,
  },
});
