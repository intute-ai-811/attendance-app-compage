import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { Icon } from 'react-native-elements';
import { styles } from './AddEmployeeScreen.styles';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UniversalModal, { UniversalModalProps } from '../../components/UniversalModal';
import { KeyboardAvoidingView, Platform } from 'react-native';
import MenuButton from '../../screens/AppDrawer/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEmployee'>;

/**
 * IMPORTANT: keep ML (VPS) base separate from ERP base.
 * - ML_BASE_URL → FastAPI service with /register (name + files[])
 * - ERP_BASE_URL → your business API for employee metadata (optional)
 */
const ML_BASE_URL = 'http://148.66.155.196:6900';
const ML_REGISTER_URL = `${ML_BASE_URL}/register`;

// your ERP metadata API (REQUIRED for real submission)
const ERP_BASE_URL = 'https://5ye41lpfm5.execute-api.ap-south-1.amazonaws.com'; // e.g. 'https://api.yourerp.com'
const ERP_CREATE_EMPLOYEE_URL = ERP_BASE_URL ? `${ERP_BASE_URL}/employee` : '';

// local draft key for persistence
const DRAFT_KEY = 'addEmployeeDraft:v1';
// Add near your other keys
const RESTORE_FLAG_KEY = 'addEmployee:restoreOnReturn';

export const FACE_PROMPTS: ReadonlyArray<string> = [
  'Look straight',
  'Turn left',
  'Turn right',
  'Look up',
  'Look down',
  'Smile',
];

const AddEmployeeScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [empId, setEmpId] = useState('');
  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // NEW: fields required by ERP
  const [dateOfJoining, setDateOfJoining] = useState(''); // expected format YYYY-MM-DD
  const [address, setAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [registeredOnML, setRegisteredOnML] = useState(false);

  const routeAny = useRoute<any>();

  // --- helpers for draft persistence ---
  const savingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  // ---------- Universal Modal state / helper ----------
  const [uVisible, setUVisible] = useState(false);
  const [uCfg, setUCfg] = useState<Omit<UniversalModalProps, 'visible'>>({
    kind: 'info',
    title: '',
    message: '',
  });

  const openUModal = (cfg: Omit<UniversalModalProps, 'visible'>) => {
  // if developer didn't specify any buttons, default to one OK button
  const hasButtons = cfg.primaryButton || cfg.secondaryButton;

  const primary =
    cfg.primaryButton ||
    (!hasButtons
      ? {
          text: 'OK',
          onPress: () => setUVisible(false),
        }
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
  // ----------------------------------------------------

  const saveDraft = async () => {
    if (!hydratedRef.current) return;
    try {
      const draft = {
        fullName,
        empId,
        userId,
        phone,
        email,
        dateOfJoining,
        address,
        videoRecorded,
        registeredOnML,
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      // non-fatal
      console.log('[AddEmployee] Failed to save draft', e);
    }
  };

  const loadDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        fullName?: string;
        empId?: string;
        userId?: string;
        phone?: string;
        email?: string;
        dateOfJoining?: string;
        address?: string;
        videoRecorded?: boolean;
        registeredOnML?: boolean;
      };
      if (typeof draft.fullName === 'string') setFullName(draft.fullName);
      if (typeof draft.empId === 'string') setEmpId(draft.empId);
      if (typeof draft.userId === 'string') setUserId(draft.userId);
      if (typeof draft.phone === 'string') setPhone(draft.phone);
      if (typeof draft.email === 'string') setEmail(draft.email);
      if (typeof draft.dateOfJoining === 'string') setDateOfJoining(draft.dateOfJoining);
      if (typeof draft.address === 'string') setAddress(draft.address);
      if (typeof draft.videoRecorded === 'boolean') setVideoRecorded(draft.videoRecorded);
      if (typeof draft.registeredOnML === 'boolean') setRegisteredOnML(draft.registeredOnML);
    } catch (e) {
      console.log('[AddEmployee] Failed to load draft', e);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  // Auto-save draft whenever fields change (debounced)
  useEffect(() => {
    if (savingRef.current) clearTimeout(savingRef.current);
    savingRef.current = setTimeout(() => {
      saveDraft();
    }, 300);
    return () => {
      if (savingRef.current) clearTimeout(savingRef.current);
    };
  }, [
    fullName,
    empId,
    userId,
    phone,
    email,
    dateOfJoining,
    address,
    videoRecorded,
    registeredOnML,
  ]);

  /// Decide whether to restore or start fresh on *first* mount only
  useEffect(() => {
    (async () => {
      try {
        const restore = await AsyncStorage.getItem(RESTORE_FLAG_KEY);
        if (restore === '1') {
          // Coming back from capture flow → restore previous draft
          await loadDraft();
        } else {
          // Fresh open or normal navigation → clear everything
          await AsyncStorage.removeItem(DRAFT_KEY);
          // Locally reset state (no need to navigate)
          setFullName('');
          setEmpId('');
          setUserId('');
          setPhone('');
          setEmail('');
          setDateOfJoining('');
          setAddress('');
          setVideoRecorded(false);
          setRegisteredOnML(false);
        }
      } finally {
        // Start autosaving only after we've hydrated/cleared
        hydratedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      (async () => {
        await loadDraft(); // ensure old draft is applied first

        const done = routeAny?.params?.videoDone;
        const ml = routeAny?.params?.mlRegistered;
        if (done !== undefined) {
          setVideoRecorded(Boolean(done));
          setRegisteredOnML(Boolean(ml));
          // clear params so it doesn't retrigger
          navigation.setParams?.({ videoDone: undefined, mlRegistered: undefined } as any);
        }
        await AsyncStorage.removeItem(RESTORE_FLAG_KEY);
      })();
    });
    return unsub;
  }, [navigation, routeAny]);

  const resetForm = () => {
    setFullName('');
    setEmpId('');
    setUserId('');
    setPhone('');
    setEmail('');
    setDateOfJoining('');
    setAddress('');
    setVideoRecorded(false);
    setRegisteredOnML(false);
    clearDraft();
  };

  const handleSubmit = async () => {
    // Validate required fields for ERP
    if (!fullName.trim()) {
      openUModal({
        kind: 'warning',
        title: 'Missing Information',
        message: 'Please enter the full name.',
      });
      return;
    }
    if (!empId.trim() || !userId.trim() || !phone.trim() || !dateOfJoining.trim() || !address.trim()) {
      openUModal({
        kind: 'warning',
        title: 'Missing Information',
        message: 'Please fill Employee ID, User ID, Phone Number, Date of Joining, and Address.',
      });
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      openUModal({
        kind: 'warning',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      });
      return;
    }
    // simple YYYY-MM-DD check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfJoining.trim())) {
      openUModal({
        kind: 'warning',
        title: 'Invalid Date',
        message: 'Date of Joining should be in YYYY-MM-DD format.',
      });
      return;
    }
    if (!videoRecorded || !registeredOnML) {
      openUModal({
        kind: 'info',
        title: 'Face Registration Required',
        message: 'Please complete face capture and upload before submitting.',
      });
      return;
    }

    // If ERP endpoint is not configured, short-circuit with success
    if (!ERP_CREATE_EMPLOYEE_URL) {
      openUModal({
        kind: 'success',
        title: 'Registration Complete',
        message: `${fullName} has been registered for face recognition. (ERP endpoint not configured)`,
        primaryButton: {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      });
      resetForm();
      return;
    }

    try {
      setSubmitting(true);
      // IMPORTANT: match ERP required JSON keys exactly
      const payload = {
        employee_id: empId.trim(),
        user_id: userId.trim(),
        phone_number: phone.trim(),
        date_of_joining: dateOfJoining.trim(),
        address: address.trim(),
        // include optional fields if ERP accepts
        name: fullName.trim(),
        email: email.trim() || undefined,
      } as const;

      const resp = await fetch(ERP_CREATE_EMPLOYEE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`ERP create failed: HTTP ${resp.status}${t ? ` – ${t}` : ''}`);
      }

      openUModal({
        kind: 'success',
        title: 'Employee Added',
        message: `${fullName} has been registered successfully.`,
        primaryButton: {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      });
      resetForm();
    } catch (err: any) {
      console.error('Submit error:', err);
      openUModal({
        kind: 'error',
        title: 'Submission Failed',
        message: err?.message ?? 'Could not submit employee.',
        
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
  <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    {/* Permanent menu button */}
    <MenuButton />

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.pad}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View style={{ width: 36 }} />

          <Text style={styles.title}>Add Employee</Text>

          <View style={{ width: 36 }} />
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          <View style={[styles.stepChip, styles.stepChipActive]}>
            <Text style={styles.stepChipText}>1 Details</Text>
          </View>
          <View style={[styles.stepChip, (videoRecorded ? styles.stepChipActive : styles.stepChipIdle)]}>
            <Text style={styles.stepChipText}>2 Face</Text>
          </View>
          <View style={[styles.stepChip, (registeredOnML ? styles.stepChipActive : styles.stepChipIdle)]}>
            <Text style={styles.stepChipText}>3 Submit</Text>
          </View>
        </View>

        {/* CARD 1: Employee Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Employee Details</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              placeholder="e.g., Aarav Sharma"
              placeholderTextColor="#6B7280"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              autoCapitalize="words"
              editable={!submitting}
              returnKeyType="next"
            />
          </View>

          {/* Emp ID + User ID */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Employee ID</Text>
              <TextInput
                placeholder="e.g., E-1023"
                placeholderTextColor="#6B7280"
                value={empId}
                onChangeText={setEmpId}
                style={styles.input}
                autoCapitalize="characters"
                editable={!submitting}
              />
            </View>

            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>User ID</Text>
              <TextInput
                placeholder="e.g., U-7788"
                placeholderTextColor="#6B7280"
                value={userId}
                onChangeText={setUserId}
                style={styles.input}
                autoCapitalize="characters"
                editable={!submitting}
              />
            </View>
          </View>

          {/* Phone + Email */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                placeholder="+91 98765 43210"
                placeholderTextColor="#6B7280"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
                editable={!submitting}
              />
            </View>

            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Email (optional)</Text>
              <TextInput
                placeholder="name@company.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />
            </View>
          </View>
        </View>

        {/* CARD 2: Employment Details */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Employment Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Joining (YYYY-MM-DD)</Text>
            <TextInput
              placeholder="2025-10-01"
              placeholderTextColor="#6B7280"
              value={dateOfJoining}
              onChangeText={setDateOfJoining}
              style={styles.input}
              keyboardType="numeric"
              editable={!submitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              placeholder="Flat 12B, Lotus Heights, Pune"
              placeholderTextColor="#6B7280"
              value={address}
              onChangeText={setAddress}
              style={[styles.input, styles.inputMultiline]}
              editable={!submitting}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* CARD 3: Face Capture */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Face Capture</Text>

          <View style={styles.faceStatus}>
            <View style={styles.faceStatusLeft}>
              <Icon
                name={
                  registeredOnML
                    ? 'check-circle'
                    : videoRecorded
                    ? 'cloud-upload'
                    : 'user-circle'
                }
                type="font-awesome"
                size={18}
                color={registeredOnML ? '#22C55E' : videoRecorded ? '#0EA5E9' : '#EAB308'}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.faceStatusTitle}>
                  {registeredOnML
                    ? 'Uploaded'
                    : videoRecorded
                    ? 'Captured'
                    : 'Not started'}
                </Text>
                <Text style={styles.faceStatusSub}>
                  {registeredOnML
                    ? 'Face data is linked to this employee.'
                    : 'Capture faces and upload to enable attendance.'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.captureBtn, submitting && { opacity: 0.6 }]}
            onPress={async () => {
              if (!fullName.trim() || !userId.trim()) {
                openUModal({
                  kind: 'info',
                  title: 'Details Required',
                  message: 'Please fill Full Name and User ID before capturing faces.',
                });
                return;
              }
              await saveDraft();
              await AsyncStorage.setItem(RESTORE_FLAG_KEY, '1');
              setVideoRecorded(false);
              setRegisteredOnML(false);

              navigation.navigate('RecordFaceVideo', {
  userId,
  fullName,              // ✅ send fullName key
  uploadUrl: ML_REGISTER_URL,
} as any);
            }}
            activeOpacity={0.9}
            disabled={submitting}
          >
            <Icon
              name={registeredOnML ? 'check' : 'camera'}
              type="font-awesome"
              size={16}
              color={registeredOnML ? '#0B1220' : '#0B1220'}
            />
            <Text style={styles.captureBtnText}>
              {registeredOnML ? 'Re-capture Faces' : 'Capture Faces & Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spacer so content isn't hidden behind sticky footer */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={[styles.stickySubmit, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.9}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#0B1220" />
              <Text style={styles.stickySubmitText}>Submitting…</Text>
            </>
          ) : (
            <Text style={styles.stickySubmitText}>
              {ERP_CREATE_EMPLOYEE_URL ? 'Submit Employee' : 'Done'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Universal modal */}
      <UniversalModal visible={uVisible} {...uCfg} onRequestClose={() => setUVisible(false)} />
    </KeyboardAvoidingView>
  </SafeAreaView>
);
};

export default AddEmployeeScreen;