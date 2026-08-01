import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { RetroApiClient } from "@retro/api-client";
import type {
  MessageDto,
  SessionDto,
} from "@retro/contracts";

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  "http://10.0.2.2:5080";

const ListComponent = FlashList as any;

export default function HomeScreen() {
  const api = useMemo(
    () => new RetroApiClient(apiUrl),
    [],
  );

  const [session, setSession] =
    useState<SessionDto | null>(null);
  const [conversationId, setConversationId] =
    useState<string | null>(null);
  const [messages, setMessages] =
    useState<MessageDto[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    void (async () => {
      const [nextSession, conversations] =
        await Promise.all([
          api.getSession(),
          api.listConversations(),
        ]);

      setSession(nextSession);

      const first = conversations[0];

      if (first) {
        setConversationId(first.id);
        setMessages(
          await api.listMessages(first.id),
        );
      }
    })();
  }, [api]);

  async function send(): Promise<void> {
    const content = draft.trim();

    if (!content || !conversationId) return;

    setDraft("");

    const result = await api.sendMessage(
      conversationId,
      `${Date.now()}-${Math.random()}`,
      content,
    );

    setMessages(current =>
      [...current, result.message].sort(
        (a, b) => a.sequence - b.sequence,
      ),
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Hồng Anh
        </Text>
        <Text style={styles.status}>
          Online
        </Text>
      </View>

      <ListComponent
        data={messages}
        estimatedItemSize={64}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: MessageDto }) => {
          const mine =
            item.senderId === session?.user.id;

          return (
            <View
              style={[
                styles.row,
                mine && styles.rowMine,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  mine && styles.bubbleMine,
                ]}
              >
                <Text
                  style={
                    mine && styles.textMine
                  }
                >
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Nhập tin nhắn..."
        />

        <TouchableOpacity
          style={styles.send}
          onPress={() => void send()}
        >
          <Text style={styles.sendText}>
            Gửi
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3f8",
  },
  header: {
    padding: 16,
    backgroundColor: "#6c3fd1",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  status: {
    color: "#ddffdf",
  },
  list: {
    padding: 14,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "white",
  },
  bubbleMine: {
    backgroundColor: "#6c3fd1",
  },
  textMine: {
    color: "white",
  },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  send: {
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#6c3fd1",
  },
  sendText: {
    color: "white",
    fontWeight: "700",
  },
});
