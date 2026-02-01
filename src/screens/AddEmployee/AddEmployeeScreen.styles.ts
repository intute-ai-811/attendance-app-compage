import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  pad: {
    padding: 16,
    paddingBottom: 28,
  },

  // Header
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },

  // Card
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E5E7EB',
    marginBottom: 10,
  },

  // Inputs
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  inputHalf: {
    flex: 1,
  },

  // Video row (reuse old photo row styles)
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addPhotoText: {
    color: '#E5E7EB',
    fontWeight: '800',
    letterSpacing: 0.3,
    fontSize: 12,
  },


  submitBtnDisabled: {
    opacity: 0.8,
  },
    // Stepper
  stepper: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  stepChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepChipActive: {
    backgroundColor: 'rgba(14,165,233,0.18)',
    borderColor: 'rgba(14,165,233,0.45)',
  },
  stepChipIdle: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: '#1F2937',
  },
  stepChipText: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 12,
  },

  // Multiline
  inputMultiline: {
    minHeight: 90,
    paddingTop: 12,
  },

  // Face capture status
  faceStatus: {
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  faceStatusLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  faceStatusTitle: {
    color: '#F8FAFC',
    fontWeight: '900',
    fontSize: 14,
  },
  faceStatusSub: {
    marginTop: 2,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Capture button
  captureBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  captureBtnText: {
    color: '#0B1220',
    fontWeight: '900',
    fontSize: 14,
  },

  // Sticky footer
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(11, 18, 32, 0.92)',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  stickySubmit: {
    backgroundColor: '#0EA5E9',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  stickySubmitText: {
    color: '#0B1220',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});