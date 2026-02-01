import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';

import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera';
import { openSettings } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UniversalModal, { UniversalModalProps } from '../../components/UniversalModal';
import Tts from 'react-native-tts';
import MenuButton from '../../screens/AppDrawer/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';

const DRAFT_KEY = 'addEmployeeDraft:v1';
const RESTORE_FLAG_KEY = 'addEmployee:restoreOnReturn';

// ====== CONFIG ======
const DEFAULT_UPLOAD_URL = 'http://148.66.155.196:6900/register';
const buildDebugInfo = (label: string, data: any) => {
  try {
    return `${label}:\n${JSON.stringify(data, null, 2)}`;
  } catch {
    return `${label}: [unserializable debug data]`;
  }
};
// Capture cadence / UI timings
const FRAME_INTERVAL_MS = 900; // ~1 fps while capturing
const PROMPT_DURATION_MS = 6000; // 6s per prompt
// Keep in sync with server-side face_processing.MAX_IMAGES (20)
const MAX_BATCH_FRAMES = 20;

const FACE_PROMPTS: ReadonlyArray<string> = [
  'Look straight',
  'Turn left',
  'Turn right',
  'Look up',
  'Look down',
  'Smile',
];

type Props = NativeStackScreenProps<RootStackParamList, 'RecordFaceVideo'>;

const RecordFaceVideoScreen: React.FC<Props> = ({ navigation, route }) => {
const { userId, fullName, uploadUrl } = (route.params as any) || {};
const ML_REGISTER_URL: string = uploadUrl || DEFAULT_UPLOAD_URL;

  // Prefer front camera, fallback to back
  const device = useCameraDevice('front') ?? useCameraDevice('back');

  // Lightweight format for fast, reliable still captures
  const format = useCameraFormat(device ?? undefined, [
    { videoResolution: { width: 640, height: 360 } },
    { photoResolution: { width: 640, height: 360 } },
  ]);

  const camera = useRef<Camera>(null);

  // permissions
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // session flags
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false); // logical "session running"
  const [busy, setBusy] = useState(false); // uploading/finalizing

  // prompts
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptCountdown, setPromptCountdown] = useState(
    PROMPT_DURATION_MS / 1000
  );
  const totalPrompts = FACE_PROMPTS.length;
  const totalDurationMs = totalPrompts * PROMPT_DURATION_MS;

  // frame batching
  const framePathsRef = useRef<string[]>([]); // file:// paths to upload
  const [capturedCount, setCapturedCount] = useState(0); // internal only (no UI)
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);
const stopCaptureRef = useRef<() => Promise<void> | null>(null);
  // timers (for cleanup)
  const timersRef = useRef<{
    tick?: ReturnType<typeof setInterval>;
    prompt?: ReturnType<typeof setInterval>;
    whole?: ReturnType<typeof setTimeout>;
    frame?: ReturnType<typeof setInterval>;
    firstTO?: ReturnType<typeof setTimeout>;
  }>({});

  // ===== Universal Modal =====
  const [uVisible, setUVisible] = useState(false);
  const [uCfg, setUCfg] = useState<Omit<UniversalModalProps, 'visible'>>({
    kind: 'info',
    title: '',
    message: '',
  });

  const openUModal = (cfg: Omit<UniversalModalProps, 'visible'>) => {
    // default “OK” button if none provided
    const hasButtons = cfg.primaryButton || cfg.secondaryButton;
    const primary =
      cfg.primaryButton ||
      (!hasButtons
        ? { text: 'OK', onPress: () => setUVisible(false) }
        : undefined);

    setUCfg({
      dismissible: true,
      ...cfg,
      primaryButton: primary
        ? {
            ...primary,
            onPress: () => {
              setUVisible(false);
              primary?.onPress?.();
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
  // ===========================

  // ===== Permissions =====
  const checkPermissions = useCallback(async () => {
    try {
      const cam = await Camera.requestCameraPermission();
      // mic not strictly required, but we keep parity with previous impl
      const mic = await Camera.requestMicrophonePermission();
      setHasPermission(cam === 'granted' && mic === 'granted');
    } catch {
      setHasPermission(false);
    } finally {
      setPermissionAsked(true);
    }
  }, []);

  useEffect(() => {
  // Basic setup
  Tts.setDucking(true); // lower other audio while speaking

  // Prefer Indian English (fallbacks if not available)
  Tts.getInitStatus()
    .then(() => {
      // Try these in order
      Tts.setDefaultLanguage('en-IN').catch(() => {
        Tts.setDefaultLanguage('en-US').catch(() => {});
      });

      // Speech rate (0.4–0.6 feels good)
      Tts.setDefaultRate(0.62, true);
    })
    .catch(() => {
      // If TTS engine missing or disabled, we won’t block the flow
    });

  return () => {
    Tts.stop();
  };
}, []);

useEffect(() => {
  if (!recording) return;

  const phrase = FACE_PROMPTS[promptIndex];
  if (!phrase) return;

  // stop any previous speech and speak current prompt
  Tts.stop();
  Tts.speak(phrase);
}, [promptIndex, recording]);

  useEffect(() => {
    if (!permissionAsked) checkPermissions();
  }, [permissionAsked, checkPermissions]);

  // block back during capture/upload
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (recording || busy) return true;
      return false;
    });
    return () => sub.remove();
  }, [recording, busy]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // ===== Helpers =====
  const clearTimers = () => {
    const t = timersRef.current;
    if (t.tick) clearInterval(t.tick);
    if (t.prompt) clearInterval(t.prompt);
    if (t.whole) clearTimeout(t.whole);
    if (t.frame) clearInterval(t.frame);
    if (t.firstTO) clearTimeout(t.firstTO);
    timersRef.current = {};
  };

  // take a still photo and buffer it (no upload here)
  const captureFrame = useCallback(async () => {
    if (!camera.current || !recording || isCapturingFrame) return;
    if (framePathsRef.current.length >= MAX_BATCH_FRAMES) return;

    setIsCapturingFrame(true);
    try {
      const photo = await camera.current.takePhoto({});
      const rawPath = photo?.path ?? '';
      if (!rawPath) throw new Error('No frame path');

      const uri = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;
      framePathsRef.current.push(uri);
      const newCount = framePathsRef.current.length;
      setCapturedCount(newCount);

      // Reached max → stop session & upload
      if (newCount >= MAX_BATCH_FRAMES) {
  await stopCaptureRef.current?.();
  return;
}
    } catch (e) {
      console.warn('Frame capture error:', e);
    } finally {
      setIsCapturingFrame(false);
    }
  }, [recording, isCapturingFrame]);

  const startFrameLoop = useCallback(() => {
    // small initial delay to let camera settle
    timersRef.current.firstTO = setTimeout(() => {
      captureFrame();
      timersRef.current.frame = setInterval(() => {
        captureFrame();
      }, FRAME_INTERVAL_MS);
    }, 300);
  }, [captureFrame]);

  // start the frame loop when recording becomes true
  useEffect(() => {
    if (recording) {
      startFrameLoop();
    }
    return () => {
      if (timersRef.current.frame) clearInterval(timersRef.current.frame);
      if (timersRef.current.firstTO) clearTimeout(timersRef.current.firstTO);
      timersRef.current.frame = undefined;
      timersRef.current.firstTO = undefined;
    };
  }, [recording, startFrameLoop]);

  // POST /register (name + files[])
 const uploadBatch = useCallback(
  async (paths: string[]) => {
    const toSend = paths.slice(0, MAX_BATCH_FRAMES); // ensure we never exceed server MAX_IMAGES
    if (!toSend.length) throw new Error('No frames captured.');
    if (!ML_REGISTER_URL) throw new Error('No ML register URL.');

    const form = new FormData();
    form.append('name', String(fullName || ''));
    form.append('user_id', String(userId || ''));

    for (let i = 0; i < toSend.length; i++) {
      form.append('files', {
        uri: toSend[i],
        name: `frame_${i + 1}.jpg`,
        type: 'image/jpeg',
      } as any);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 240_000);

    const startedAt = Date.now();

    try {
      const res = await fetch(ML_REGISTER_URL, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });
      const durationMs = Date.now() - startedAt;
      clearTimeout(timeout);

      const responseText = await res.text().catch(() => '');

      if (!res.ok) {
        const richError: any = new Error(
          `Register failed: HTTP ${res.status}${
            responseText ? ` – ${responseText.slice(0, 200)}` : ''
          }`
        );
        richError.debugInfo = {
          url: ML_REGISTER_URL,
          status: res.status,
          durationMs,
          framesSent: toSend.length,
          responsePreview: responseText?.slice(0, 500),
        };
        throw richError;
      }

      // If OK but we already consumed text, try to parse it as JSON if possible
      let json: any = {};
      try {
        json = responseText ? JSON.parse(responseText) : {};
      } catch {
        json = { raw: responseText };
      }
      return json;
    } catch (e: any) {
      clearTimeout(timeout);

      // Attach client-side debug info if not already present
      if (!e.debugInfo) {
        e.debugInfo = {
          url: ML_REGISTER_URL,
          framesSent: toSend.length,
          elapsedMs: Date.now() - startedAt,
          errorName: e?.name,
          errorMessage: e?.message,
        };
      }

      throw e;
    }
  },
  [ML_REGISTER_URL, userId, fullName]
);

  const cleanupPhotos = useCallback(async () => {
    await Promise.allSettled(
      framePathsRef.current.map(async (p) => {
        try {
          const plain = p.replace('file://', '');
          await RNFS.unlink(plain);
        } catch {}
      })
    );
  }, []);

  const finalizeUpload = useCallback(async () => {
    setBusy(true);
    Tts.stop();
Tts.speak('Uploading your face data. Please wait.');

    try {
      // last-chance capture if nothing collected yet
      if (framePathsRef.current.length === 0 && camera.current) {
        try {
          const photo = await camera.current.takePhoto({});
          const rawPath = photo?.path ?? '';
          if (rawPath) {
           const uri = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;
            framePathsRef.current.push(uri);
            const newCount = framePathsRef.current.length;
            setCapturedCount(newCount);
          }
        } catch {}
      }

      await uploadBatch(framePathsRef.current);
      await cleanupPhotos();

      openUModal({
        kind: 'success',
        title: 'Face ID Registered',
        message: "Your Face ID has been Registed Successfully",
        primaryButton: {
          text: 'OK',
          onPress: async () => {
            // persist flags so AddEmployee reads them on focus
            await AsyncStorage.mergeItem(
              DRAFT_KEY,
              JSON.stringify({ videoRecorded: true, registeredOnML: true })
            );
            // tell AddEmployee to restore instead of clearing
            await AsyncStorage.setItem(RESTORE_FLAG_KEY, '1');
            // go back to the existing AddEmployee instance
            navigation.goBack();
          },
        },
      });
    } catch (e: any) {
  console.error('Batch upload error', e);

  const debugInfo = buildDebugInfo('Debug info', {
    url: ML_REGISTER_URL,
    framesCaptured: framePathsRef.current.length,
    errorName: e?.name,
    errorMessage: e?.message,
    // anything that uploadBatch attached:
    backendDebug: e?.debugInfo || null,
  });

  // You can hide this behind __DEV__ if you only want it in dev,
  // but since you want to see it in release, we show it directly.
  const userMessage = e?.message ?? 'Could not upload photos.';

  openUModal({
    kind: 'error',
    title: 'Registration Failed',
    message: `${userMessage}\n\n${debugInfo}`,
    primaryButton: {
      text: 'OK',
      onPress: async () => {
        await AsyncStorage.mergeItem(
          DRAFT_KEY,
          JSON.stringify({ videoRecorded: true, registeredOnML: false })
        );
        await AsyncStorage.setItem(RESTORE_FLAG_KEY, '1');
        navigation.goBack();
      },
    },
  });
} finally {
      setBusy(false);
      framePathsRef.current = [];
      setCapturedCount(0);
    }
  }, [uploadBatch, cleanupPhotos, navigation]);

  // ===== Capture session controls =====
  const startCapture = useCallback(async () => {
    if (!device || !cameraReady || !hasPermission) {
      openUModal({
        kind: 'warning',
        title: 'Camera Not Ready',
        message: 'Please ensure camera permission is granted and camera is initialized.',
      });
      return;
    }
    if (!userId || !fullName) {
  openUModal({
    kind: 'warning',
    title: 'Missing Info',
    message: 'User ID and Full Name are required before recording.',
  });
  return;
}

    try {
      setRecording(true);
      Tts.stop();
Tts.speak('Starting face registration. Follow the instructions.');
      setBusy(false);
      framePathsRef.current = [];
      setCapturedCount(0);

      // prompts UI timers
      setPromptIndex(0);
      setPromptCountdown(PROMPT_DURATION_MS / 1000);

      timersRef.current.tick = setInterval(() => {
        setPromptCountdown((s) => (s <= 1 ? PROMPT_DURATION_MS / 1000 : s - 1));
      }, 1000);

      let idx = 0;
      timersRef.current.prompt = setInterval(() => {
        idx += 1;
        if (idx < totalPrompts) setPromptIndex(idx);
      }, PROMPT_DURATION_MS);

      // total session timeout → finalize
      timersRef.current.whole = setTimeout(() => {
  stopCaptureRef.current?.();
}, totalDurationMs);
    } catch (e: any) {
      setRecording(false);
      clearTimers();
      openUModal({
        kind: 'error',
        title: 'Error Starting Capture',
        message: e?.message ?? 'Unable to start.',
      });
    }
  }, [device, cameraReady, hasPermission, userId, fullName,totalPrompts, totalDurationMs]);

  const stopCapture = useCallback(async () => {
    Tts.stop();
Tts.speak('Stopping capture.');
  clearTimers();
  try {
    await finalizeUpload();
  } finally {
    setRecording(false);
  }
}, [finalizeUpload]);

useEffect(() => {
  stopCaptureRef.current = stopCapture;
}, [stopCapture]);

  const disabledStart = !device || !hasPermission || !cameraReady || recording || busy;

  return (
    <View style={s.wrap}>
      <MenuButton />
      <SafeAreaView edges={['top']} style={s.safeTop}>
  <View style={s.header}>
    <Text style={s.title}>Face Registration</Text>
  </View>
</SafeAreaView>

      <View style={s.cameraBox}>
        {!hasPermission ? (
          <View style={s.center}>
            <ActivityIndicator size="large" />
            <Text style={s.hint}>Waiting for camera permission…</Text>
            {!!permissionAsked && (
              <TouchableOpacity
                onPress={() => openSettings()}
                style={[s.mainBtn, { marginTop: 12 }]}
              >
                <Text style={s.mainBtnTxt}>Open Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : !device ? (
          <View style={s.center}>
            <ActivityIndicator size="large" />
            <Text style={s.hint}>Loading camera device…</Text>
          </View>
        ) : (
          <>
            <Camera
              ref={camera}
              style={s.camera}
              device={device}
              format={format}
              isActive={true}
              photo={true}
              video={false}
              audio={false}
              onInitialized={() => setCameraReady(true)}
              onError={(err) => {
                console.error('Camera error', err);
                openUModal({
                  kind: 'error',
                  title: 'Camera Error',
                  message: err?.message ?? 'Unknown error.',
                });
              }}
            />
            {/* Overlay prompt (NO frame counters in UI) */}
            <View style={s.overlay}>
              {recording ? (
                <>
                  <View style={s.promptPill}>
  <Text style={s.promptTxt}>{FACE_PROMPTS[promptIndex]}</Text>
  <Text style={s.promptSub}>
    Step {promptIndex + 1} / {FACE_PROMPTS.length}
  </Text>
</View>
<Text style={s.countdown}>{promptCountdown}s</Text>
                </>
              ) : (
                <Text style={s.readyTxt}>
                  We’ll guide you through:{'\n'}
                  {FACE_PROMPTS.join(' • ')}
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      <View style={s.controls}>
        {!recording ? (
          <TouchableOpacity
            style={[s.mainBtn, disabledStart && { opacity: 0.5 }]}
            disabled={disabledStart}
            onPress={startCapture}
          >
            <Icon name="video-camera" type="font-awesome" size={18} color="#0B1220" />
            <Text style={s.mainBtnTxt}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.stopBtn} onPress={stopCapture}>
            <Icon name="stop" type="font-awesome" size={16} color="#0B1220" />
            <Text style={s.stopBtnTxt}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {busy && (
        <View style={s.loadingCover}>
          <ActivityIndicator size="large" />
          <Text style={s.loadingTxt}>Uploading…</Text>
        </View>
      )}

      {/* Global universal modal */}
      <UniversalModal
        visible={uVisible}
        {...uCfg}
        onRequestClose={() => setUVisible(false)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0B1220' },
  header: {
  paddingTop: 8,          // add a bit more breathing room
  paddingBottom: 12,
  paddingHorizontal: 12,
  alignItems: 'center',
  justifyContent: 'center',
  borderBottomWidth: 1,
  borderBottomColor: '#1E293B',
},
 title: {
  color: '#F8FAFC',
  fontWeight: '900',
  fontSize: 16,
},

  cameraBox: { flex: 1 },
  camera: { flex: 1 },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    pointerEvents: 'none',
  },
  promptPill: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(14,165,233,0.2)',
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  promptTxt: {
    color: '#E0F2FE',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  countdown: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  readyTxt: {
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '700',
  },

  controls: {
  padding: 16,
  borderTopWidth: 1,
  borderTopColor: '#1E293B',
  backgroundColor: 'rgba(15,23,42,0.96)',
},
  mainBtn: {
  height: 54,
  borderRadius: 18,
  backgroundColor: '#0EA5E9',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: 10,
},
mainBtnTxt: { color: '#0B1220', fontWeight: '900', fontSize: 16 },

  stopBtn: {
  height: 54,
  borderRadius: 18,
  backgroundColor: '#FCD34D',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: 10,
},
  stopBtnTxt: { color: '#0B1220', fontWeight: '900' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { color: '#E5E7EB', fontWeight: '700' },

  loadingCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,18,32,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingTxt: { color: '#E5E7EB', fontWeight: '800' },
  promptSub: {
  marginTop: 4,
  color: '#BAE6FD',
  fontWeight: '800',
  fontSize: 12,
  textAlign: 'center',
},
safeTop: {
  backgroundColor: '#0B1220',
},
});

export default RecordFaceVideoScreen;