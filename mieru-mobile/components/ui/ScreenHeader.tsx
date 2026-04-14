import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/config";

interface ScreenHeaderProps {
  title: string;
}

export function ScreenHeader({ title }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.black,
  },
});
