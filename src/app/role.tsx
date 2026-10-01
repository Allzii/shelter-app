import {
  Accessibility,
  HandHeart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function RoleScreen() {
  const selectNeedsHelp = () => {
    router.push("/needs-help");
  };

  const selectHelper = () => {
    router.push("/helper-verification");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeft size={24} color="#2F6591" />
          <Text style={styles.backText}>Tillbaka</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Hur vill du använda{"\n"}TryggNära?
        </Text>

        <Text style={styles.subtitle}>
          Välj det alternativ som passar dig.
        </Text>

        <View style={styles.options}>
          {/* Needs help */}
          <Pressable
            onPress={selectNeedsHelp}
            style={({ pressed }) => [
              styles.option,
              pressed && styles.optionPressed,
            ]}
          >
            <View style={styles.iconContainer}>
              <Accessibility
                size={30}
                color="#236C78"
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Jag behöver hjälp</Text>

              <Text style={styles.optionDescription}>
                Jag kan behöva stöd för att ta mig till trygghet.
              </Text>
            </View>

            <ChevronRight
              size={24}
              color="#71808E"
            />
          </Pressable>

          {/* Wants to help */}
          <Pressable
            onPress={selectHelper}
            style={({ pressed }) => [
              styles.option,
              pressed && styles.optionPressed,
            ]}
          >
            <View style={styles.iconContainer}>
              <HandHeart
                size={30}
                color="#236C78"
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Jag vill hjälpa</Text>

              <Text style={styles.optionDescription}>
                Jag vill kunna hjälpa personer i min närhet.
              </Text>
            </View>

            <ChevronRight
              size={24}
              color="#71808E"
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF4F7",
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 16,
  },

  backText: {
    marginLeft: 3,
    fontSize: 16,
    fontWeight: "600",
    color: "#2F6591",
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 55,
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
    marginTop: 42,
    gap: 16,
  },

  option: {
    minHeight: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  optionPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E3F2F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  optionContent: {
    flex: 1,
    paddingRight: 10,
  },

  optionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#172536",
    marginBottom: 7,
  },

  optionDescription: {
    fontSize: 15,
    lineHeight: 21,
    color: "#5B6878",
  },

  pressed: {
    opacity: 0.6,
  },
});
