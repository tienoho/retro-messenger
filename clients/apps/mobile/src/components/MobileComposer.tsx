import {
  ScrollView,
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

const QUICK_EMOTICONS = [
  ":)",
  ":(",
  ";-)",
  ":D",
  ":P",
  "=((",
  "B-)",
  ":-O",
  "X(",
  "(BUZZ)",
];

export function MobileComposer({
  conversationId,
  draft,
  onDraftChange,
  onSend,
}: MobileComposerProps) {
  const hasConv = Boolean(conversationId);
  const canSend = hasConv && draft.trim().length > 0;

  const handleInsertEmoticon = (code: string) => {
    if (code === "(BUZZ)") {
      onSend("BUZZ!!!");
      return;
    }
    const space = draft.length > 0 && !draft.endsWith(" ") ? " " : "";
    onDraftChange(`${draft}${space}${code} `);
  };

  return (
    <View style={styles.container}>
      {/* Quick Yahoo Emoticon Toolbar */}
      <View style={styles.quickBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickBarContent}
        >
          {QUICK_EMOTICONS.map((code) => (
            <TouchableOpacity
              key={code}
              disabled={!hasConv}
              style={[styles.quickEmoticonBtn, !hasConv && styles.disabled]}
              onPress={() => handleInsertEmoticon(code)}
            >
              <Text
                style={[
                  styles.quickEmoticonText,
                  code === "(BUZZ)" && styles.buzzTagText,
                ]}
              >
                {code}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            disabled={!hasConv}
            style={[styles.audibleChip, !hasConv && styles.disabled]}
            onPress={() => onSend("[Audible] Hey! Có ai ở đó không?!")}
          >
            <Text style={styles.audibleChipText}>Hey!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!hasConv}
            style={[styles.audibleChip, !hasConv && styles.disabled]}
            onPress={() => onSend("[Audible] Bye Bye! Tạm biệt nhé!")}
          >
            <Text style={styles.audibleChipText}>Bye!</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Composer Row */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ede7f6",
    borderTopWidth: 1,
    borderTopColor: "#7f9db9",
  },
  quickBar: {
    backgroundColor: "#e1d6ee",
    borderBottomWidth: 1,
    borderBottomColor: "#d4c8e3",
    paddingVertical: 4,
  },
  quickBarContent: {
    paddingHorizontal: 8,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  quickEmoticonBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#bba8d2",
  },
  quickEmoticonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5b1e84",
  },
  buzzTagText: {
    color: "#cc0000",
    fontWeight: "900",
  },
  audibleChip: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  audibleChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9a3412",
  },
  composer: {
    flexDirection: "row",
    gap: 6,
    padding: 8,
    alignItems: "center",
  },
  buzzButton: {
    backgroundColor: "#fed633",
    paddingHorizontal: 9,
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
    fontSize: 13,
    color: "#111111",
  },
  send: {
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 3,
    backgroundColor: "#5b1e84",
  },
  sendText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
