import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  ...args: undefined extends RootStackParamList[RouteName]
    ? [screen: RouteName] | [screen: RouteName, params: RootStackParamList[RouteName]]
    : [screen: RouteName, params: RootStackParamList[RouteName]]
) {
  if (!navigationRef.isReady()) return;
  (navigationRef.navigate as any)(...args);
}