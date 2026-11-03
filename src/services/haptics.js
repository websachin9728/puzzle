import * as Haptics from "expo-haptics";

let enabled = true;

export function setHapticsEnabled(on) {
  enabled = on;
}

export function haptic(kind) {
  if (!enabled) return;
  try {
    if (kind === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (kind === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (kind === "heavy") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else if (kind === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (kind === "select") Haptics.selectionAsync();
  } catch (e) {}
}
