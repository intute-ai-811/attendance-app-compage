import React, { useEffect, useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootStackParamList } from './navigation/types';

// Screens
// import SignupScreen from './src/screens/Signupscreen/signupscreen';
// import OTPVerificationScreen from './src/screens/OTPscreen/otpscreen';
import HomeScreen from './src/screens/Homescreen/homescreen';
// import LoginScreen from './src/screens/Loginscreen/loginscreen';
import DashboardScreen from './src/screens/Dashboard/dashboard';
import AddEmployeeScreen from './src/screens/AddEmployee/AddEmployeeScreen';
import RecordFaceVideoScreen from './src/screens/attendance/RecordFaceVideoScreen';
import { AppDrawerProvider, useAppDrawer } from './src/screens/AppDrawer/AppDrawerProvider';
import SideMenu from './src/screens/SideMenu/SideMenu';
import { navigationRef, navigate } from './src/navigation/navigationRef';
import BootSplash from "react-native-bootsplash";
import BrandOverlay from "./src/screens/Splash/BrandOverlay";
import { requestInitialPermissionsOnce } from "./src/utils/requestInitialPermissions";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Optional: dark nav theme to match your app colors (prevents white flash)
const DarkNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0B1220',
    card: '#0B1220',
    text: '#F8FAFC',
    border: '#0B1220',
    primary: '#0EA5E9',
  },
};
const Root = () => {
  const { open, closeDrawer } = useAppDrawer();

  return (
  <>
    <NavigationContainer ref={navigationRef} theme={DarkNavTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0B1220' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
        <Stack.Screen name="RecordFaceVideo" component={RecordFaceVideoScreen} />
      </Stack.Navigator>
    </NavigationContainer>

    {/* ✅ Global drawer must be AFTER navigator so it overlays all screens */}
    <SideMenu
  visible={open}
  onClose={closeDrawer}
  onNavigateHome={() => {
    closeDrawer();
    navigate('Home');
  }}
  onNavigateAddEmployee={() => {
    closeDrawer();
    navigate('AddEmployee', {}); // ✅ if AddEmployee params require object
  }}
/>
  </>
);
};

const App = () => {
  const [showBrand, setShowBrand] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Keep native splash until JS is ready
      // Then show overlay briefly and hide native splash
      await new Promise(res => setTimeout(res, 300));
      BootSplash.hide({ fade: true });

      // Keep brand overlay visible a bit longer
      setTimeout(() => setShowBrand(false), 1400);
    };

    init();
  }, []);

  useEffect(() => {
  const init = async () => {
    // Ask permissions on first launch
    await requestInitialPermissionsOnce();

    // then your splash hide logic
    await new Promise(res => setTimeout(res, 300));
    BootSplash.hide({ fade: true });
    setTimeout(() => setShowBrand(false), 1400);
  };

  init();
}, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        hidden
        animated
        translucent
        backgroundColor="transparent"
        barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
      />

      <AppDrawerProvider>
        <Root />
      </AppDrawerProvider>

      {/* modern overlay on top of everything */}
      <BrandOverlay visible={showBrand} />
    </GestureHandlerRootView>
  );
};

export default App;