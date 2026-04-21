import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalInit() {
  useEffect(() => {
    // @ts-ignore
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    
    // Check if OneSignal is already initialized to avoid "SDK already initialized" error
    // @ts-ignore
    if (appId && !window.OneSignal?.initialized) {
      OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true,
      }).then(() => {
        console.log('OneSignal Initialized');
      }).catch((err) => {
        // Log to console but don't crash or alert
        console.warn('OneSignal Init (Non-critical):', err?.message || err);
      });
    }
  }, []);

  return null;
}
