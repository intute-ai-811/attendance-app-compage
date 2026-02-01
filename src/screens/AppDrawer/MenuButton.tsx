import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useAppDrawer } from './AppDrawerProvider';

type Props = {
  color?: string;
};

const MenuButton: React.FC<Props> = ({ color = '#FFF' }) => {
  const { open, openDrawer } = useAppDrawer();

  // hide when drawer is open so drawer covers it
  if (open) return null;

  return (
    <TouchableOpacity style={styles.btn} onPress={openDrawer} activeOpacity={0.85}>
      <Icon name="bars" type="font-awesome" size={20} color={color} />
    </TouchableOpacity>
  );
};

export default MenuButton;

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    top: 18,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    elevation: 5,
  },
});