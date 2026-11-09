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
        const isAudible = item.content.startsWith("[Audible]");

        if (isBuzz) {
          return (
            <View style={styles.buzzBanner}>
              <Text style={styles.buzzText}>
                BUZZ! {mine ? "BẠN VỪA GỬI BUZZ!" : "BẠN NHẬN ĐƯỢC MỘT BUZZ!"}
              </Text>
            </View>
          );
        }

        if (isAudible) {
          return (
            <View style={styles.audibleBanner}>
              <Text style={styles.audibleText}>
                {mine ? "Bạn gửi Audible: " : "Đối phương gửi Audible: "}
                {item.content}
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
            <Text style={styles.seqText}>#{item.sequence}</Text>
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
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  senderLabel: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
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
  seqText: {
    fontSize: 9,
    color: "#aaaaaa",
    marginLeft: 6,
  },
  buzzBanner: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ff9999",
    borderRadius: 4,
    padding: 8,
    marginVertical: 6,
    alignItems: "center",
  },
  buzzText: {
    color: "#cc0000",
    fontWeight: "900",
    fontSize: 12,
  },
  audibleBanner: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 4,
    padding: 8,
    marginVertical: 4,
  },
  audibleText: {
    color: "#9a3412",
    fontWeight: "700",
    fontSize: 12,
  },
});
