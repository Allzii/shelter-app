import { Accessibility, HandHeart, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenHeader from "@/components/ui/ScreenHeader";

export default function RoleScreen() {
  const { width } = useWindowDimensions();

  const selectNeedsHelp = () => {
    router.push("/needs-help");
  };

  const selectHelper = () => {
    router.push("/helper-verification");
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundShapes} pointerEvents="none">
        <View
          style={[
            styles.circleTop,
            {
              width: width * 0.58,
              height: width * 0.58,
              borderRadius: width * 0.29,
            },
          ]}
        />

        <View
          style={[
            styles.circleBottom,
            {
              width: width * 0.78,
              height: width * 0.78,
              borderRadius: width * 0.39,
            },
          ]}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader />

        <View style={styles.content}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Hur vill du använda{"\n"}TryggNära?
          </Text>

          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Välj det alternativ som passar dig.
          </Text>

          <View style={styles.options}>
            <Pressable
              onPress={selectNeedsHelp}
              accessibilityRole="button"
              accessibilityLabel="Jag behöver hjälp"
              accessibilityHint="Jag kan behöva stöd för att ta mig till trygghet."
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={[styles.iconContainer, styles.iconNeedsHelp]}>
                <Accessibility size={32} color="#236C78" />
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle} maxFontSizeMultiplier={1.3}>
                  Jag behöver hjälp
                </Text>

                <Text
                  style={styles.optionDescription}
                  maxFontSizeMultiplier={1.3}
                >
                  Jag kan behöva stöd för att ta mig till trygghet.
                </Text>
              </View>

              <View style={styles.chevronCircle}>
                <ChevronRight size={20} color="#5B7288" />
              </View>
            </Pressable>

            <Pressable
              onPress={selectHelper}
              accessibilityRole="button"
              accessibilityLabel="Jag vill hjälpa"
              accessibilityHint="Jag vill kunna hjälpa personer i min närhet."
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={[styles.iconContainer, styles.iconHelper]}>
                <HandHeart size={32} color="#2F6591" />
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle} maxFontSizeMultiplier={1.3}>
                  Jag vill hjälpa
                </Text>

                <Text
                  style={styles.optionDescription}
                  maxFontSizeMultiplier={1.3}
                >
                  Jag vill kunna hjälpa personer i min närhet.
                </Text>
              </View>

              <View style={styles.chevronCircle}>
                <ChevronRight size={20} color="#5B7288" />
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF4F7",
  },

  safeArea: {
    flex: 1,
  },

  backgroundShapes: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },

  circleTop: {
    position: "absolute",
    backgroundColor: "#A8C8DE",
    top: "-10%",
    right: "-24%",
    opacity: 0.55,
  },

  circleBottom: {
    position: "absolute",
    backgroundColor: "#254F75",
    bottom: "-24%",
    left: "-22%",
    opacity: 0.2,
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
  },

  title: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: "#142235",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 24,
    color: "#607080",
  },

  options: {
    marginTop: 36,
    gap: 16,
  },

  option: {
    minHeight: 132,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#DCE7EE",
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#254F75",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },

  optionPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  iconNeedsHelp: {
    backgroundColor: "#DDF0F1",
  },

  iconHelper: {
    backgroundColor: "#E1ECF6",
  },

  optionContent: {
    flex: 1,
    paddingRight: 10,
  },

  optionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#172536",
    marginBottom: 6,
  },

  optionDescription: {
    fontSize: 15,
    lineHeight: 21,
    color: "#5B6878",
  },

  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F8",
    alignItems: "center",
    justifyContent: "center",
  },
});