import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../components/drawer/CustomerDrawerContent';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 220 },
      }}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="mood-checkin" />
      <Drawer.Screen name="counseling" />
      <Drawer.Screen name="recovery-plan" />
      <Drawer.Screen name="insights" />
      <Drawer.Screen name="settings" />
    </Drawer>
  );
}