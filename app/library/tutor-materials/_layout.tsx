import { Stack } from 'expo-router';

export default function TutorMaterialsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[moduleId]" />
    </Stack>
  );
}
