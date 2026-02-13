// models/Settings.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    // Main section
    mainBg: { type: String, default: '#F8FAFF' },
    mainText: { type: String, default: '#1F2937' },
    btnBg: { type: String, default: '#475569' },
    btnText: { type: String, default: '#FFFFFF' },

    // Form section
    headingBg: { type: String, default: '#1E293B' },
    headingText: { type: String, default: '#FFFFFF' },
    submitBg: { type: String, default: '#475569' },
    submitText: { type: String, default: '#FFFFFF' },
    cancelBg: { type: String, default: '#F9FAFB' },
    cancelText: { type: String, default: '#64748B' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
