import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

export interface MobileMessageBubbleProps extends PropsWithChildren {
  mine?: boolean;
}

export function MobileMessageBubble({
  mine = false,
  children,
}: MobileMessageBubbleProps) {
  return (
    <View style={[styles.bubble, mine && styles.mine]}>
      {children}
    </View>
  );
}

export function MobileRetroStatusBadge({
  status,
}: {
  status: string;
}) {
  const norm = status.toLowerCase();
  const color =
    norm === "online"
      ? "#22c55e"
      : norm === "away"
        ? "#eab308"
        : norm === "busy"
          ? "#ef4444"
          : "#94a3b8";

  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e6b8b8",
    backgroundColor: "#fff8f8",
  },
  mine: {
    borderColor: "#b0c4de",
    backgroundColor: "#f4f6fc",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
  },
});
