import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    textAlign: 'center',
  },
  controlOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay
    justifyContent: 'space-between',
    padding: 20,
  },
  controlPanel: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 20,
  },
  actionButton: {
    width: '90%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  controlButton: {
    width: '90%',
    backgroundColor: 'rgba(31, 41, 55, 0.8)', // Semi-transparent dark button
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 10,
  },
  card: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#BBB',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#00AEEF',
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },

    // ===== Option A: Modern bottom sheet UI =====
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  sheet: {
    backgroundColor: 'rgba(17, 24, 39, 0.92)', // slate-900 w/ opacity
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },

  sheetHeader: {
    marginBottom: 12,
  },

  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'left',
  },

  sheetSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'left',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  statusChipText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: '600',
  },

  btnPrimary: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#2563EB', // blue-600
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  btnPrimaryDisabled: {
    opacity: 0.65,
  },

  btnPrimaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },

  btnSecondary: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  btnSecondaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
    menuButton: {
  position: 'absolute',
  top: 18,
  left: 16,
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor: 'rgba(17, 24, 39, 0.55)',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  elevation: 50,
},
  
});