// MongoDB initialization script
// Sets up default system settings and blockchain configuration

import { connectToDatabase } from './connection';
import { SystemSettingsModel, BlockchainConfigModel } from './models';

export async function initializeSystemDefaults(): Promise<void> {
  try {
    await connectToDatabase();

    // Insert default system settings if they don't exist
    const existingSettings = await SystemSettingsModel.countDocuments({ 
      setting_key: 'prescription_expiry_days' 
    });

    if (existingSettings === 0) {
      const defaultSettings = [
        {
          setting_key: 'prescription_expiry_days',
          setting_value: '30',
          description: 'Number of days before a prescription expires'
        },
        {
          setting_key: 'low_stock_threshold',
          setting_value: '10',
          description: 'Minimum stock level to trigger alerts'
        },
        {
          setting_key: 'max_upload_size',
          setting_value: '5242880',
          description: 'Maximum file upload size in bytes (5MB)'
        },
        {
          setting_key: 'allowed_file_types',
          setting_value: 'jpg,jpeg,png,pdf',
          description: 'Allowed file types for uploads'
        }
      ];

      await SystemSettingsModel.insertMany(defaultSettings);
      console.log('✅ Default system settings created');
    }

    // Insert default blockchain configuration if it doesn't exist
    const existingBlockchainConfig = await BlockchainConfigModel.countDocuments({ 
      network_name: 'Base' 
    });

    if (existingBlockchainConfig === 0) {
      const blockchainConfig = new BlockchainConfigModel({
        network_name: 'Base',
        rpc_endpoint: 'https://mainnet.helius-rpc.com/?api-key=c56adc77-a357-46ba-9057-b75652c873c4',
        is_active: true
      });

      await blockchainConfig.save();
      console.log('✅ Default blockchain configuration created');
    }

    console.log('✅ System initialization completed');
  } catch (error) {
    console.error('❌ System initialization error:', error);
    throw error;
  }
}

export default initializeSystemDefaults;