import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";

export default function StartScreen() {
  const [aboutVisible, setAboutVisible] = useState(false);
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    let receivedMotionChange = false;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 6500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 6500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    const updateMotion = (reduce: boolean) => {
      animation.stop();
      if (reduce) drift.setValue(0);
      else {
        animation.reset();
        animation.start();
      }
    };
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduce) => {
        receivedMotionChange = true;
        if (active) updateMotion(reduce);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (active && !receivedMotionChange) updateMotion(reduce);
      })
      .catch(() => drift.setValue(0));
    return () => {
      active = false;
      animation.stop();
      listener.remove();
    };
  }, [drift]);

  const handleGetStarted = () => {
    router.push("/sign-up");
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundShapes} pointerEvents="none">
        <Animated.View
          style={[
            styles.circleTop,
            {
              transform: [
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 12],
                  }),
                },
                {
                  translateY: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circleRight,
            {
              transform: [
                {
                  translateY: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circleBottom,
            {
              transform: [
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Pressable
          onPress={() => setAboutVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Så fungerar AppNamn"
          style={({ pressed }) => [
            styles.aboutButton,
            pressed && styles.aboutPressed,
          ]}
        >
          <Text style={styles.aboutText} maxFontSizeMultiplier={1.3}>
            Så fungerar det
          </Text>
        </Pressable>

        <View style={styles.main}>
          <Image
            source={require("../../assets/images/app-icon.png")}
            style={styles.logo}
          />

          <Text style={styles.brand} maxFontSizeMultiplier={1.3}>
            AppNamn
          </Text>

          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Du behöver inte{"\n"}gå ensam
          </Text>

          <Text style={styles.description} maxFontSizeMultiplier={1.3}>
            Trygg hjälp från människor i din närhet när det behövs.
          </Text>
        </View>

        <View style={styles.bottom}>
          <PrimaryButton title="Kom igång" onPress={handleGetStarted} />

          <Pressable
            onPress={() => router.push("/login")}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.aboutPressed,
            ]}
          >
            <Text style={styles.aboutText}>
              Har du redan ett konto? Logga in
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <Modal
        visible={aboutVisible}
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <SafeAreaView style={styles.aboutPage}>
          <ScrollView contentContainerStyle={styles.aboutContent}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Stäng informationen"
              onPress={() => setAboutVisible(false)}
              style={styles.closeButton}
            >
              <X size={26} color={colors.primary} />
            </Pressable>
            <Text style={styles.aboutTitle} accessibilityRole="header">
              Så fungerar AppNamn
            </Text>
            <Text style={styles.aboutIntro}>
              Stöd från människor i närheten, när du behöver hjälp att ta dig
              till trygghet.
            </Text>
            {[
              [
                "Be om hjälp",
                "Registrera dina uppgifter och det stöd du behöver. Med ett kopplat armband kan du hålla inne knappen i 1,5 sekunder för att skicka en förfrågan. Armbandet behöver internet.",
              ],
              [
                "En volontär accepterar",
                "Godkända volontärer kan se förfrågan och välja att hjälpa till. Du följer statusen under Hem. Armbandet bekräftar när det fått svar.",
              ],
              [
                "Bekräfta att hjälpen är klar",
                "Volontären meddelar när hjälpen är klar. Du, eller den som registrerat dig, bekräftar avslutet i appen. Du kan också avbryta förfrågan.",
              ],
            ].map(([title, description], index) => (
              <View key={title} style={styles.aboutStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{title}</Text>
                  <Text style={styles.stepDescription}>{description}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.aboutIntro}>
              Vill du hjälpa till? Välj ”Jag vill hjälpa” när du registrerar dig
              och lämna in ditt utbildningsintyg för granskning.
            </Text>
            <View style={styles.aboutFooter}>
              <PrimaryButton
                title="Jag förstår"
                onPress={() => setAboutVisible(false)}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    color: "#0D3F68",
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

  loginButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  aboutButton: {
    alignSelf: "flex-end",
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 19,
  },

  aboutPressed: {
    opacity: 0.6,
  },

  aboutText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  aboutPage: { flex: 1, backgroundColor: colors.background },
  aboutContent: { padding: 24, paddingBottom: 36 },
  closeButton: {
    alignSelf: "flex-end",
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  aboutTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    color: colors.text,
  },
  aboutIntro: {
    marginTop: 16,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  aboutStep: { flexDirection: "row", gap: 14, marginTop: 26 },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  stepNumberText: { fontSize: 18, fontWeight: "700", color: colors.surface },
  stepBody: { flex: 1 },
  stepTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },
  stepDescription: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
  },
  aboutFooter: { marginTop: 30 },
});
