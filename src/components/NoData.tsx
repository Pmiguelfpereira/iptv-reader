import AntDesign from "@react-native-vector-icons/ant-design/static";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

export function NoData({
  message = "No media available",
  style,
}: {
  message?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.noData, style]}>
      <AntDesign name="meh" size={48} color="#8a8a8a" />
      <Text style={styles.noDataText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noData: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  noDataText: {
    color: "#8a8a8a",
    fontSize: 18,
    textAlign: "center",
  },
});
