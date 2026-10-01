import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";

export default function StartScreen() {
  const handleGetStarted = () => {
    router.push("/role");
  };

  const handleAbout = () => {
    // TODO: Add information about TryggNära.
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundShapes} pointerEvents="none">
        <View style={styles.circleTop} />
        <View style={styles.circleRight} />
        <View style={styles.circleBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.main}>
          <Image
            source={require("../../assets/images/tryggnara.png")}
            style={styles.logo}
          />

          <Text style={styles.brand} maxFontSizeMultiplier={1.3}>
            TryggNära
          </Text>

          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Du behöver inte{"\n"}gå ensam
          </Text>

          <Text style={styles.description} maxFontSizeMultiplier={1.3}>
            Trygg hjälp från människor i din närhet när det behövs.
          </Text>
        </View>

        <View style={styles.bottom}>
          <PrimaryButton
            title="Kom igång"
            onPress={handleGetStarted}
          />

          <Pressable
            onPress={handleAbout}
            accessibilityRole="button"
            accessibilityLabel="Så fungerar TryggNära"
            style={({ pressed }) => [
              styles.aboutButton,
              pressed && styles.aboutPressed,
            ]}
          >
            <Text style={styles.aboutText} maxFontSizeMultiplier={1.3}>
              Så fungerar TryggNära
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
  },

  backgroundShapes: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },

  circleTop: {
    position: "absolute",
    width: "68%",
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: "#A8C8DE",
    top: "-18%",
    left: "-26%",
    opacity: 0.6,
  },

  circleRight: {
    position: "absolute",
    width: "47%",
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: "#5687AE",
    top: "22%",
    right: "-32%",
    opacity: 0.3,
  },

  circleBottom: {
    position: "absolute",
    width: "78%",
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: "#254F75",
    bottom: "-24%",
    left: "-22%",
    opacity: 0.25,
  },

  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 25,
  },

  logo: {
    width: 125,
    height: 125,
    resizeMode: "contain",
    marginBottom: 22,
  },

  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: "#236C78",
    marginBottom: 18,
  },

  title: {
    textAlign: "center",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    maxWidth: 310,
    marginTop: 16,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 27,
    color: "#43535F",
  },

  bottom: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 28,
  },

  aboutButton: {
    paddingVertical: 19,
    paddingHorizontal: 20,
  },

  aboutPressed: {
    opacity: 0.6,
  },

  aboutText: {
    color: "#315D7E",
    fontSize: 16,
    fontWeight: "600",
  },
});