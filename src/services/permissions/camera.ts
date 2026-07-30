import { Platform } from 'react-native';
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
  type PermissionStatus,
} from 'react-native-permissions';

export type CameraPermissionState = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited';

const CAMERA = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

function mapStatus(status: PermissionStatus): CameraPermissionState {
  switch (status) {
    case RESULTS.GRANTED:
      return 'granted';
    case RESULTS.LIMITED:
      return 'limited';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.UNAVAILABLE:
    default:
      return 'unavailable';
  }
}

export async function checkCameraPermission(): Promise<CameraPermissionState> {
  return mapStatus(await check(CAMERA));
}

export async function requestCameraPermission(): Promise<CameraPermissionState> {
  const current = await checkCameraPermission();
  if (current === 'granted' || current === 'limited') {
    return current;
  }
  if (current === 'blocked') {
    return current;
  }
  return mapStatus(await request(CAMERA));
}

export async function openAppSettings(): Promise<void> {
  await openSettings();
}
