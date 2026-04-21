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
        // If it's already initialized, we can ignore this specific error
        if (err?.message?.includes('already initialized')) {
          return;
        }
        console.error('OneSignal Init Error:', err);
      });
    }
  }, []);

  return null;
}
