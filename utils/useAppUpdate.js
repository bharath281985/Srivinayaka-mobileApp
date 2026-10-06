import { useEffect, useRef, useState } from 'react';
import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';

const ANDROID_PACKAGE = 'com.srivinayakacollections.android';
const IOS_BUNDLE_ID = 'com.srivinayakacollections.ios';

/**
 * Compares two semver strings.
 * Returns true if `remote` is newer than `local`.
 */
function isNewerVersion(local, remote) {
  if (!local || !remote) return false;
  const parse = (v) => String(v).replace(/[^0-9.]/g, '').split('.').map(Number);
  const [lMaj = 0, lMin = 0, lPatch = 0] = parse(local);
  const [rMaj = 0, rMin = 0, rPatch = 0] = parse(remote);
  if (rMaj !== lMaj) return rMaj > lMaj;
  if (rMin !== lMin) return rMin > lMin;
  return rPatch > lPatch;
}

/**
 * Direct client-side Apple App Store lookup (Zero backend/admin dependency)
 */
async function fetchDirectAppStoreVersion() {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}&country=in&_t=${Date.now()}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.resultCount > 0 && json.results[0]?.version) {
      return {
        version: json.results[0].version,
        storeUrl: json.results[0].trackViewUrl,
        releaseNotes: json.results[0].releaseNotes,
      };
    }
  } catch (e) {
    // Non-fatal, fallback to backend settings
  }
  return null;
}

/**
 * useAppUpdate
 *
 * Checks for updates automatically:
 * 1. Checks backend /api/app-management/mobile-settings (which auto-syncs with Play Store & App Store)
 * 2. On iOS: Also directly queries Apple iTunes API for zero-delay store detection
 * 3. Compares device version against store version
 * 4. Provides direct deep-links (market:// and itms-apps://) to open native store apps
 */
export function useAppUpdate() {
  const [state, setState] = useState({
    updateAvailable: false,
    forceUpdate: false,
    storeUrl: '',
    updateMessage: '',
    checked: false,
  });
  const dismissed = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function checkVersion() {
      try {
        const currentVersion =
          Constants.expoConfig?.version ||
          Constants.manifest?.version ||
          '0.0.0';

        const isAndroid = Platform.OS === 'android';

        // 1. Fetch backend settings (synced automatically with stores)
        let backendData = null;
        try {
          const { data } = await api.get('/api/app-management/mobile-settings');
          backendData = data;
        } catch (apiErr) {
          console.warn('[AppUpdate] Backend settings unreachable, trying direct store check:', apiErr.message);
        }

        let remoteVersion = null;
        let storeUrl = '';
        let forceUpdate = false;
        let updateMessage = 'A new version of Sri Vinayaka Collections is available on the store. Please update for the best experience and latest features.';

        if (backendData) {
          remoteVersion = isAndroid ? backendData.latestAndroidVersion : backendData.latestIosVersion;
          storeUrl = isAndroid
            ? backendData.androidStoreUrl || `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
            : backendData.iosStoreUrl || 'https://apps.apple.com/app/id0000000000';
          forceUpdate = !!backendData.forceUpdate;
          if (backendData.updateMessage) {
            updateMessage = backendData.updateMessage;
          }
        }

        // 2. On iOS, also perform direct iTunes check for instant zero-admin detection
        if (!isAndroid) {
          const directApple = await fetchDirectAppStoreVersion();
          if (directApple?.version) {
            if (!remoteVersion || isNewerVersion(remoteVersion, directApple.version)) {
              remoteVersion = directApple.version;
              if (directApple.storeUrl) storeUrl = directApple.storeUrl;
              if (directApple.releaseNotes) {
                updateMessage = `What's New in ${directApple.version}:\n${directApple.releaseNotes}`;
              }
            }
          }
        }

        const updateAvailable = isNewerVersion(currentVersion, remoteVersion);

        console.log(
          `[AppUpdate] Current Version: ${currentVersion} | Store Version: ${remoteVersion} | Update Available: ${updateAvailable}`
        );

        if (isMounted && updateAvailable && !dismissed.current) {
          setState({
            updateAvailable: true,
            forceUpdate,
            storeUrl,
            updateMessage,
            checked: true,
          });
        } else if (isMounted) {
          setState((prev) => ({ ...prev, checked: true }));
        }
      } catch (e) {
        console.warn('[AppUpdate] Version check error:', e.message);
        if (isMounted) setState((prev) => ({ ...prev, checked: true }));
      }
    }

    checkVersion();
    return () => { isMounted = false; };
  }, []);

  /**
   * Open the native store app directly via deep link, with browser fallback
   */
  const openStore = async () => {
    try {
      if (Platform.OS === 'android') {
        const marketUri = `market://details?id=${ANDROID_PACKAGE}`;
        const canOpenMarket = await Linking.canOpenURL(marketUri);
        if (canOpenMarket) {
          await Linking.openURL(marketUri);
          return;
        }
        const webUrl = state.storeUrl || `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
        await Linking.openURL(webUrl);
      } else {
        const url = state.storeUrl || 'https://apps.apple.com/app/id0000000000';
        await Linking.openURL(url);
      }
    } catch (err) {
      console.warn('[AppUpdate] Failed to open store URL:', err.message);
      if (state.storeUrl) {
        Linking.openURL(state.storeUrl).catch(() => {});
      }
    }
  };

  const dismiss = () => {
    if (!state.forceUpdate) {
      dismissed.current = true;
      setState((prev) => ({ ...prev, updateAvailable: false }));
    }
  };

  return { ...state, openStore, dismiss };
}
