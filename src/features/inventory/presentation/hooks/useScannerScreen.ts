import { useCallback, useEffect, useState } from 'react';

import { container, TOKENS } from '@/core/di';
import type { LookupSkuUseCase } from '@/features/inventory/application/use-cases/lookup-sku.usecase';
import {
  checkCameraPermission,
  requestCameraPermission,
  type CameraPermissionState,
} from '@/services/permissions/camera';
import { useSessionStore } from '@/services/auth/session-store';
import type { WarehouseId } from '@/types/ids';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export type ScannerViewState = {
  permission: CameraPermissionState | 'loading';
  torchOn: boolean;
  toggleTorch: () => void;
  manualSku: string;
  setManualSku: (value: string) => void;
  errorMessage: string | null;
  isLookingUp: boolean;
  requestPermission: () => void;
  submitManual: () => void;
  onBarcode: (value: string) => void;
};

export function useScannerScreen(
  onFoundBalance: (balanceId: string) => void,
  onPermissionBlocked: () => void,
): ScannerViewState {
  const warehouseId = useSessionStore((s) => s.warehouseId);
  const [permission, setPermission] = useState<CameraPermissionState | 'loading'>('loading');
  const [torchOn, setTorchOn] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void checkCameraPermission().then((state) => {
      if (!cancelled) {
        setPermission(state);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lookup = useCallback(
    (sku: string) => {
      if (!warehouseId || locked) {
        return;
      }
      setLocked(true);
      setIsLookingUp(true);
      setErrorMessage(null);
      const useCase = container.resolve<LookupSkuUseCase>(TOKENS.LOOKUP_SKU_USE_CASE);
      void useCase.execute({ warehouseId: warehouseId as WarehouseId, sku }).then((result) => {
        setIsLookingUp(false);
        if (!result.ok) {
          setLocked(false);
          setErrorMessage(result.error.userMessage);
          ReactNativeHapticFeedback.trigger('notificationError');
          return;
        }
        ReactNativeHapticFeedback.trigger('notificationSuccess');
        onFoundBalance(result.value.id);
      });
    },
    [locked, onFoundBalance, warehouseId],
  );

  const requestPermission = useCallback(() => {
    void requestCameraPermission().then((state) => {
      setPermission(state);
      if (state === 'blocked') {
        onPermissionBlocked();
      }
    });
  }, [onPermissionBlocked]);

  return {
    permission,
    torchOn,
    toggleTorch: () => setTorchOn((v) => !v),
    manualSku,
    setManualSku,
    errorMessage,
    isLookingUp,
    requestPermission,
    submitManual: () => lookup(manualSku),
    onBarcode: (value) => lookup(value),
  };
}
