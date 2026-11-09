import { StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { MessageDto, SessionDto } from "@retro/contracts";

export interface MobileTranscriptProps {
  session: SessionDto;
  messages: MessageDto[];
}

export function MobileTranscript({ session, messages }: MobileTranscriptProps) {
  return (
    <FlashList
      data={messages}
      contentContainerStyle={styles.list}
      keyExtractor={(item) => item.id}
      renderItem={({ item }: { item: MessageDto }) => {
        const mine = item.senderId === session.user.id;
        const isBuzz =
          item.content === "BUZZ!!!" || item.content === "(BUZZ)";

        if (isBuzz) {
          return (
            <View style={styles.buzzBanner}>
              <Text style={styles.buzzText}>
                BUZZ! {mine ? "BẠN VỪA GỬI BUZZ!" : "BẠN NHẬN ĐƯỢC MỘT BUZZ!"}
              </Text>
            </View>
          );
        }

        return (
          <View style={styles.transcriptLine}>
            <Text
              style={[
                styles.senderLabel,
                mine ? styles.senderMine : styles.senderPeer,
              ]}
            >
              {mine ? "Bạn: " : "Bạn bè: "}
              <Text style={styles.messageContent}>{item.content}</Text>
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: "#ffffff" },
  transcriptLine: {
    marginBottom: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  senderLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  senderMine: {
    color: "#0000cc",
  },
  senderPeer: {
    color: "#cc0000",
  },
  messageContent: {
    color: "#111111",
    fontWeight: "400",
  },
  buzzBanner: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ff9999",
    borderRadius: 4,
    padding: 6,
    marginVertical: 6,
    alignItems: "center",
  },
  buzzText: {
    color: "#cc0000",
    fontWeight: "800",
    fontSize: 12,
  },
});
