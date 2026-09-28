import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import { ChevronRight } from "lucide-react-native";

export default function StartScreen() {
  const handleGetStarted = () => {
    router.push("/role");
  };

  const handleAbout = () => {
    //lägg till sen
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundShapes} pointerEvents="none">
        <View style={styles.circleTop} />
        <View style={styles.circleRight} />
        <View style={styles.circleBottom} />
      </View>
      <View style={styles.main}>
        <Image
          source={require("../../assets/images/tryggnara.png")}
          style={styles.logo}
        />

        <Text style={styles.brand}>TryggNära</Text>

        <Text style={styles.title}>
          Du behöver inte{"\n"}gå ensam
        </Text>

        <Text style={styles.description}>
          Trygg hjälp från människor i din närhet när det behövs.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Kom igång</Text>
          <ChevronRight
            size={22}
            color="#FFFFFF"
            style={styles.arrow}
          />
        </Pressable>

        <Pressable
          onPress={handleAbout}
          style={({ pressed }) => [
            styles.aboutButton,
            pressed && styles.aboutPressed,
          ]}
        >
          <Text style={styles.aboutText}>Så fungerar TryggNära</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({


  backgroundShapes: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },

  circleTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#A8C8DE",
    top: -130,
    left: -100,
    opacity: 0.75,
  },

  circleRight: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#5687AE",
    top: 190,
    right: -120,
    opacity: 0.45,
  },

  circleBottom: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#254F75",
    bottom: -210,
    left: -80,
    opacity: 0.4,
  },

  container: {
    flex: 1,
    backgroundColor: "#EEF4F7",
    paddingHorizontal: 28,
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
    fontSize: 15,
    fontWeight: "700",

    color: "#236C78",
    marginBottom: 18,
  },

  title: {
    textAlign: "center",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: "#142235",
  },

  description: {
    maxWidth: 310,
    marginTop: 16,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 27,
    color: "#536476",
  },

  bottom: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 28,
  },

  primaryButton: {
    width: "94%",
    height: 58,
    borderRadius: 13,
    backgroundColor: "#2F6591",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  arrow: {
    position: "absolute",
    right: 22,
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