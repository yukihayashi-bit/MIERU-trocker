import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { SyncProvider } from "../hooks/useSyncStatus";
import { DatabaseProvider, useDatabase } from "../providers/DatabaseProvider";
import { COLORS } from "../constants/config";

function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isLoading, isAuthenticated, segments]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Slot />;
}

/** SyncProvider は db と tenantId を必要とするため、Auth と DB の内側で使う */
function SyncWrapper({ children }: { children: React.ReactNode }) {
  const db = useDatabase();
  const { profile } = useAuth();

  return (
    <SyncProvider db={db} tenantId={profile?.tenant_id ?? null}>
      {children}
    </SyncProvider>
  );
}

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <SyncWrapper>
          <StatusBar style="dark" />
          <RootNavigator />
        </SyncWrapper>
      </AuthProvider>
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
});
