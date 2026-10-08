import { Wifi } from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";

export default function ConnectBraceletScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 5 av 5" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Koppla armbandet</Text>

        <Text style={styles.description}>
          Armbandet används för att be om hjälp.
        </Text>

        <View style={styles.main}>
          <View
            style={styles.illustration}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.braceletShadow} />

            <View style={styles.bracelet}>
              <View style={styles.topStrap}>
                <View style={styles.strapLine} />
                <View style={styles.strapLine} />
              </View>

              <View style={styles.braceletBody}>
                <View style={styles.braceletFace}>
                  <View style={styles.braceletButton}>
                    <View style={styles.buttonHighlight} />
                  </View>

                  <View style={styles.indicator} />
                </View>
              </View>

              <View style={styles.bottomStrap}>
                <View style={styles.strapHole} />
                <View style={styles.strapHole} />
                <View style={styles.strapHole} />
              </View>
            </View>

            <View style={styles.wifiBadge}>
              <Wifi
                size={24}
                color={colors.primary}
                strokeWidth={2}
              />
            </View>
          </View>

          <Text style={styles.braceletTitle}>Ditt armband</Text>

          <Text style={styles.braceletDescription}>
            Här kommer du att kunna koppla ditt armband.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
  },

  title: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },

  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 60,
  },

  illustration: {
    width: 250,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },

  bracelet: {
    alignItems: "center",
    transform: [{ rotate: "-14deg" }],
  },

  topStrap: {
    width: 65,
    height: 61,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#234D72",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  strapLine: {
    width: 37,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#416D90",
  },

  braceletBody: {
    width: 110,
    height: 108,
    borderRadius: 32,
    padding: 7,
    backgroundColor: "#173B5A",
    shadowColor: "#142235",
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },

  braceletFace: {
    flex: 1,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#315F84",
    borderWidth: 1,
    borderColor: "#527C9C",
  },

  braceletButton: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: "#E8F0F5",
    borderWidth: 4,
    borderColor: "#C2D6E4",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonHighlight: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },

  indicator: {
    position: "absolute",
    bottom: 10,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#94B0C5",
  },

  bottomStrap: {
    width: 65,
    height: 61,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: "#234D72",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  strapHole: {
    width: 15,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#173B5A",
  },

  braceletShadow: {
    position: "absolute",
    bottom: 3,
    width: 125,
    height: 13,
    borderRadius: 70,
    backgroundColor: "#254F75",
    opacity: 0.09,
  },

  wifiBadge: {
    position: "absolute",
    top: 37,
    right: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#DCE7EE",
  },

  braceletTitle: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },

  braceletDescription: {
    maxWidth: 290,
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
});