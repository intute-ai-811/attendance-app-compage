import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Icon } from 'react-native-elements';

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
  onNavigateAddEmployee: () => void;
  onNavigateHome: () => void;
};

const SCREEN_W = Dimensions.get('window').width;
const DRAWER_W = Math.min(320, SCREEN_W * 0.78);

const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose, onNavigateAddEmployee, onNavigateHome }) => {
  const slideX = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(overlay, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -DRAWER_W, duration: 200, useNativeDriver: true }),
        Animated.timing(overlay, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlay, slideX]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
      {/* overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: overlay },
          styles.overlay,
        ]}
      />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideX }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="close" type="font-awesome" size={18} color="#E5E7EB" />
          </TouchableOpacity>
        </View>

<TouchableOpacity
  style={styles.item}
  activeOpacity={0.85}
  onPress={() => {
    onClose();
    onNavigateHome();
  }}
>
  <Icon name="home" type="font-awesome" size={18} color="#FFF" />
  <Text style={styles.itemText}>Home</Text>
</TouchableOpacity>

<View style={{ height: 10 }} />
        <TouchableOpacity
  style={styles.item}
  activeOpacity={0.85}
  onPress={() => {
    onClose();
    onNavigateAddEmployee();
  }}
>
  <Icon name="user-plus" type="font-awesome" size={18} color="#FFF" />
  <Text style={styles.itemText}>Add Employee</Text>
</TouchableOpacity>

        {/* Add more items later */}
        {/* <TouchableOpacity style={styles.item}><Text>Settings</Text></TouchableOpacity> */}
      </Animated.View>
    </View>
  );
};

export default SideMenu;

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_W,
    backgroundColor: '#111827', // slate-900
    paddingTop: 52,
    paddingHorizontal: 16,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  item: {
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  itemText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});