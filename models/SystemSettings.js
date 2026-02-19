import mongoose from 'mongoose';

const systemSettingsSchema = mongoose.Schema({
    smsEnabled: { type: Boolean, default: true },
    reminderDays: { type: [Number], default: [7, 3, 1] },
    defaulterAlerts: { type: Boolean, default: true },
    autoBackup: { type: Boolean, default: true },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    dataRetention: { type: Number, default: 365 },
    sessionTimeout: { type: Number, default: 30 },
    passwordPolicy: { type: String, enum: ['basic', 'medium', 'strong'], default: 'strong' },
    twoFactorAuth: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// Singleton pattern: ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return await this.create({});
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
