import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

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

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "white",
  },
  mine: {
    backgroundColor: "#6c3fd1",
  },
});
