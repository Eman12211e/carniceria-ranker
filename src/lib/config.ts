import Constants from 'expo-constants';

interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: 'development' | 'staging' | 'production';
  appVersion: string;
  stripePublishableKey: string;
}

const DEV_CONFIG: AppConfig = {
  supabaseUrl: 'http://localhost:54321',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  environment: 'development',
  appVersion: Constants.expoConfig?.version ?? '0.1.0',
  stripePublishableKey: 'pk_test_placeholder',
};

const PROD_CONFIG: AppConfig = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  environment: 'production',
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_KEY ?? '',
};

export const config: AppConfig = __DEV__ ? DEV_CONFIG : PROD_CONFIG;

export function isDev(): boolean {
  return config.environment === 'development';
}

export function isProd(): boolean {
  return config.environment === 'production';
}
