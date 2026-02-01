import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

type Props = { visible: boolean };

export default function BrandOverlay({ visible }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(1);

    // Keep visible for a moment, then fade out
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start();
    }, 900);

    return () => clearTimeout(t);
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[s.wrap, { opacity }]} pointerEvents="none">
      <View style={s.center}>
        <Image
          source={require("../../assets/intuteLogo.png")}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.powered}>Powered by intute.ai</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1220",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
    elevation: 999999,
  },
  center: { alignItems: "center" },
  logo: { width: 240, height: 110 },
  powered: {
    marginTop: 10,
    color: "#9CA3AF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.4,
  },
});