import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface MobileComposerProps {
  conversationId: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (customContent?: string) => void;
}

export function MobileComposer({
  conversationId,
  draft,
  onDraftChange,
  onSend,
}: MobileComposerProps) {
  const hasConv = Boolean(conversationId);
  const canSend = hasConv && draft.trim().length > 0;

  return (
    <View style={styles.composer}>
      <TouchableOpacity
        accessibilityRole="button"
        disabled={!hasConv}
        style={[styles.buzzButton, !hasConv && styles.disabled]}
        onPress={() => onSend("BUZZ!!!")}
      >
        <Text style={styles.buzzButtonText}>BUZZ!</Text>
      </TouchableOpacity>
      <TextInput
        editable={hasConv}
        placeholder={hasConv ? "Nhập tin nhắn…" : "Chưa có cuộc trò chuyện"}
        placeholderTextColor="#888888"
        style={styles.input}
        value={draft}
        onChangeText={onDraftChange}
        onSubmitEditing={() => onSend()}
      />
      <TouchableOpacity
        accessibilityRole="button"
        disabled={!canSend}
        style={[styles.send, !canSend && styles.disabled]}
        onPress={() => onSend()}
      >
        <Text style={styles.sendText}>Gửi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: "row",
    gap: 6,
    padding: 8,
    backgroundColor: "#ede7f6",
    borderTopWidth: 1,
    borderTopColor: "#7f9db9",
    alignItems: "center",
  },
  buzzButton: {
    backgroundColor: "#fed633",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#d4a000",
  },
  buzzButtonText: {
    color: "#cc0000",
    fontWeight: "900",
    fontSize: 11,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#7f9db9",
    borderRadius: 3,
    backgroundColor: "#ffffff",
    fontSize: 12,
    color: "#111111",
  },
  send: {
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 3,
    backgroundColor: "#5b1e84",
  },
  sendText: { color: "white", fontWeight: "700", fontSize: 12 },
  disabled: { opacity: 0.5 },
});

