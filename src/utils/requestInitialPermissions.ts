import { Platform } from "react-native";
import { check, request, RESULTS, PERMISSIONS } from "react-native-permissions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "initial_permissions_requested:v1";

export async function requestInitialPermissionsOnce() {
  const already = await AsyncStorage.getItem(KEY);
  if (already === "1") return;

  await AsyncStorage.setItem(KEY, "1");

  const cameraPermission =
    Platform.OS === "android"
      ? PERMISSIONS.ANDROID.CAMERA
      : PERMISSIONS.IOS.CAMERA;

  const status = await check(cameraPermission);

  if (status !== RESULTS.GRANTED) {
    await request(cameraPermission);
  }
}