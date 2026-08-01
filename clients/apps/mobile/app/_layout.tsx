import { Stack } from "expo-router";

const StackComponent = Stack as any;

export default function Layout() {
  return (
    <StackComponent
      screenOptions={{
        headerStyle: {
          backgroundColor: "#6c3fd1",
        },
        headerTintColor: "white",
      }}
    />
  );
}
