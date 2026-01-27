import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import { Icon } from 'react-native-elements';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from '../Homescreen/homescreen.styles';
import { RootStackParamList } from '../../../navigation/types';
import { useIsFocused } from '@react-navigation/native';
import UniversalModal, { UniversalModalProps } from '../../components/UniversalModal';

// ======= CONFIG: set your VPS endpoint here =======
const VPS_UPLOAD_URL = 'http://148.66.155.196:6900/mark_attendance';
// ================================================

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;


const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const isFocused = useIsFocused();
  const camera = useRef<Camera>(null);

  // NEW: Universal modal state
  const [uModal, setUModal] = useState<Omit<UniversalModalProps, 'visible'>>({
    kind: 'info',
    title: '',
    message: '',
  });
  const [uVisible, setUVisible] = useState(false);

  const openUModal = (cfg: Omit<UniversalModalProps, 'visible'>) => {
    setUModal({
      dismissible: true,
      ...cfg,
      // ensure buttons close the modal before custom handlers
      primaryButton: cfg.primaryButton
        ? {
            ...cfg.primaryButton,
            onPress: () => {
              setUVisible(false);
              cfg.primaryButton?.onPress?.();
            },
          }
        : undefined,
      secondaryButton: cfg.secondaryButton
        ? {
            ...cfg.secondaryButton,
            onPress: () => {
              setUVisible(false);
              cfg.secondaryButton?.onPress?.();
            },
          }
        : undefined,
    });
    setUVisible(true);
  };

  // In your setup, devices is an array
  const device = useCameraDevice('front');

  // ---- Permissions (Camera only; no microphone needed) ----
  const checkPermissions = async () => {
    try {
      let cameraStatus;

      if (Platform.OS === 'android') {
        cameraStatus = await check(PERMISSIONS.ANDROID.CAMERA);
      } else {
        cameraStatus = await check(PERMISSIONS.IOS.CAMERA);
      }

      if (cameraStatus === RESULTS.GRANTED) {
        const cameraPermission = await Camera.getCameraPermissionStatus();
        if (cameraPermission === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          setShowPermissionModal(true);
        }
      } else {
        setHasPermission(false);
        setShowPermissionModal(true);
      }
      setPermissionAsked(true);
    } catch (error) {
      console.error('Permission check error:', error);
      openUModal({
        kind: 'error',
        title: 'Permission Error',
        message: 'Failed to check permissions.',
      });
    }
  };

  const requestSystemPermissions = async () => {
    try {
      let cameraStatus;

      if (Platform.OS === 'android') {
        cameraStatus = await request(PERMISSIONS.ANDROID.CAMERA);
      } else {
        cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
      }

      if (cameraStatus === RESULTS.GRANTED) {
        const cameraPermission = await Camera.requestCameraPermission();
        if (cameraPermission === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          openUModal({
            kind: 'warning',
            title: 'Permission Denied',
            message: 'Camera access is required.',
          });
        }
      } else if (cameraStatus === RESULTS.BLOCKED) {
        openUModal({
          kind: 'warning',
          title: 'Permission Blocked',
          message: 'Camera access is blocked. Please enable it in Settings.',
          primaryButton: {
            text: 'Open Settings',
            onPress: () => openSettings(),
          },
          secondaryButton: {
            text: 'Cancel',
          },
        });
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      openUModal({
        kind: 'error',
        title: 'Permission Error',
        message: 'Failed to request permissions.',
      });
    }
  };

  const handlePermissionRequest = async (option: 'allow' | 'onlyThisTime' | 'deny') => {
    setShowPermissionModal(false);
    if (option === 'deny') {
      setPermissionAsked(true);
      return;
    }
    await requestSystemPermissions();
    await checkPermissions();
  };

  // ---- Capture + Upload (no video recording) ----
  const handleCaptureImage = async () => {
    if (!device || !cameraReady) {
      openUModal({
        kind: 'info',
        title: 'Camera not ready',
        message: 'Please wait until the camera is ready…',
      });
      return;
    }

    if (!hasPermission) {
      await checkPermissions();
      return;
    }

    try {
      setCapturing(true);

      const photo: PhotoFile | undefined = await camera.current?.takePhoto({});

      if (!photo?.path) {
        setCapturing(false);
        openUModal({
          kind: 'error',
          title: 'Capture Failed',
          message: 'Failed to capture image.',
        });
        return;
      }

      setImagePaths((prev) => [...prev, photo.path]);

      const fileUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const filename = `frame-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;

      const form = new FormData();
      form.append(
        'file',
        {
          uri: fileUri,
          name: filename,
          type: 'image/jpeg',
        } as any
      );

      const res = await fetch(VPS_UPLOAD_URL, {
  method: 'POST',
  body: form,
});

const data = await res.json().catch(() => null);

if (!res.ok) {
  throw new Error(data?.message || `Upload failed (${res.status})`);
}

if (!data || !data.status) {
  throw new Error('Invalid server response');
}

     switch (data.status) {
  case 'marked':
  openUModal({
    kind: 'success',
    title: 'Attendance Marked',
    message: `ID: ${data.user_id || data.person_id}\n${
      data.message || 'Your attendance has been recorded.'
    }`,
  });
  break;

  case 'no_face':
  case 'no_match':
  case 'low_confidence':
    openUModal({
      kind: 'warning',
      title: 'Not Marked',
      message: data.message || 'Attendance could not be marked.',
    });
    break;

  default:
    openUModal({
      kind: 'error',
      title: 'Error',
      message: data.message || 'Something went wrong.',
    });
}

    } catch (error: any) {
      console.error('Capture/Upload error:', error);
      openUModal({
        kind: 'error',
        title: 'Upload Error',
        message: error?.message ?? 'Failed to upload image.',
      });
    } finally {
      setCapturing(false);
    }
  };

  useEffect(() => {
    if (!permissionAsked) {
      checkPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Early UI returns ----
  if (!permissionAsked || !hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mark your Attendance</Text>

        {/* Retain your existing permission modal UI (can be swapped to UniversalModal later if you want) */}
        {/* {!hasPermission && (
          <Modal
            transparent
            visible={showPermissionModal}
            animationType="fade"
            onRequestClose={() => setShowPermissionModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Icon name="camera" type="font-awesome" size={40} color="#00AEEF" style={styles.modalIcon} />
                <Text style={styles.modalTitle}>Allow adas_system to use the camera?</Text>
                <Text style={styles.modalSubtitle}>While using the app</Text>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('allow')}>
                  <Text style={styles.modalButtonText}>WHILE USING THE APP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('onlyThisTime')}>
                  <Text style={styles.modalButtonText}>ONLY THIS TIME</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('deny')}>
                  <Text style={styles.modalButtonText}>DON'T ALLOW</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )} */}

        <TouchableOpacity
          style={styles.card}
          onPress={handleCaptureImage}
          activeOpacity={0.8}
          disabled={!hasPermission}
        >
          <Icon name="camera" size={40} color="#1F2937" style={{ marginBottom: 10 }} />
          <Text style={styles.cardTitle}>{hasPermission ? 'Capture Image' : 'Permissions Required'}</Text>
          <Text style={styles.cardSubtitle}>
            {hasPermission ? 'Capture a frame and send to server' : 'Please grant camera permission'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { marginTop: 20 }]}
          onPress={() => navigation.navigate('Dashboard', { imagePaths })}
          activeOpacity={0.8}
        >
          <Icon name="dashboard" size={40} color="#1F2937" style={{ marginBottom: 10 }} />
          <Text style={styles.cardTitle}>Dashboard</Text>
          <Text style={styles.cardSubtitle}>Go to your dashboard and settings</Text>
        </TouchableOpacity>

        {/* Universal Modal (global) */}
        <UniversalModal
          visible={uVisible}
          {...uModal}
          onRequestClose={() => setUVisible(false)}
        />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1F2937" />
        <Text style={styles.text}>Loading Camera...</Text>

        <UniversalModal
          visible={uVisible}
          {...uModal}
          onRequestClose={() => setUVisible(false)}
        />
      </View>
    );
  }

  // ---- Main camera view (front camera, photo only) ----
  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        photo={true}
        onInitialized={() => setCameraReady(true)}
        onError={(error) => {
          console.error('Camera Error:', error);
          openUModal({
            kind: 'error',
            title: 'Camera Error',
            message: error.message,
          });
        }}
      />

      <View style={styles.controlOverlay}>
        <Text style={styles.title}>Mark Your Attendance</Text>

        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCaptureImage}
            activeOpacity={0.8}
            disabled={capturing}
          >
            <Icon name="camera" size={40} color="#FFF" style={{ marginBottom: 10 }} />
            <Text style={styles.actionButtonText}>
              {capturing ? 'Capturing...' : 'Capture Image'}
            </Text>
            <Text style={styles.actionButtonSubtitle}>
              {capturing ? 'Processing & uploading' : 'Send current frame to server'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Dashboard', { imagePaths })}
            activeOpacity={0.8}
          >
            <Icon name="dashboard" size={40} color="#FFF" style={{ marginBottom: 10 }} />
            <Text style={styles.actionButtonText}>Dashboard</Text>
            <Text style={styles.actionButtonSubtitle}>Go to your dashboard and settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Universal Modal (global) */}
      <UniversalModal
        visible={uVisible}
        {...uModal}
        onRequestClose={() => setUVisible(false)}
      />
    </View>
  );
};

export default HomeScreen;