import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ModalStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { useTheme } from '@/ui/theme';
import { useScannerScreen } from '@/features/inventory/presentation/hooks/useScannerScreen';
import { DEFAULT_CODE_TYPES } from '@/services/camera/types';
import { t } from '@/i18n';

export type ScannerScreenProps = NativeStackScreenProps<
  ModalStackParamList,
  typeof Routes.Scanner
>;

export function ScannerScreen({ navigation }: ScannerScreenProps): React.JSX.Element {
  const theme = useTheme();
  const device = useCameraDevice('back');
  const lastScanRef = useRef(0);

  const state = useScannerScreen(
    (balanceId) => {
      navigation.goBack();
      // Bubble to inventory stack
      (navigation.getParent()?.navigate as (name: string, params?: object) => void)?.(
        Routes.Tabs,
        {
          screen: Routes.InventoryTab,
          params: {
            screen: Routes.BalanceDetail,
            params: { balanceId },
          },
        },
      );
    },
    () => {
      navigation.replace(Routes.PermissionDenied, { permission: 'camera' });
    },
  );

  const onCodeScanned = useCallback(
    (codes: Array<{ value?: string }>) => {
      const now = Date.now();
      if (now - lastScanRef.current < 1500) {
        return;
      }
      const value = codes[0]?.value;
      if (!value) {
        return;
      }
      lastScanRef.current = now;
      state.onBarcode(value);
    },
    [state],
  );

  const codeScanner = useCodeScanner({
    codeTypes: [...DEFAULT_CODE_TYPES],
    onCodeScanned,
  });

  const cameraAllowed =
    state.permission === 'granted' || state.permission === 'limited';

  return (
    <Box flex={1} background="background">
      <Box flex={1}>
        {cameraAllowed && device ? (
          <View style={StyleSheet.absoluteFill}>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive
              torch={state.torchOn ? 'on' : 'off'}
              codeScanner={codeScanner}
            />
            <View
              pointerEvents="none"
              style={[
                styles.overlay,
                { borderColor: theme.colors.brand.primary },
              ]}
              accessibilityElementsHidden
            />
          </View>
        ) : (
          <Box flex={1} padding={4} justify="center" gap={3}>
            <Text variant="h2">{t('scanner.cameraUnavailable')}</Text>
            <Text variant="body" color="secondary">
              {t('scanner.useManual')}
            </Text>
            {state.permission === 'denied' || state.permission === 'loading' ? (
              <Button
                label={t('scanner.allowCamera')}
                onPress={state.requestPermission}
              />
            ) : null}
            {state.permission === 'blocked' ? (
              <Button
                label={t('scanner.openSettings')}
                onPress={() =>
                  navigation.replace(Routes.PermissionDenied, { permission: 'camera' })
                }
              />
            ) : null}
          </Box>
        )}
      </Box>

      <Box padding={4} gap={3} background="surfaceRaised">
        <Box row justify="space-between" align="center">
          <Text variant="h2">{t('scanner.title')}</Text>
          {cameraAllowed && device ? (
            <Button
              label={state.torchOn ? t('scanner.torchOff') : t('scanner.torchOn')}
              size="sm"
              variant="secondary"
              onPress={state.toggleTorch}
              accessibilityLabel={t('scanner.torchOn')}
            />
          ) : null}
        </Box>
        <Input
          label={t('scanner.manualSku')}
          value={state.manualSku}
          onChangeText={state.setManualSku}
          autoCapitalize="characters"
          autoCorrect={false}
          accessibilityLabel={t('scanner.manualSku')}
        />
        {state.errorMessage ? (
          <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
            {state.errorMessage}
          </Text>
        ) : null}
        <Button
          label={t('scanner.lookup')}
          onPress={state.submitManual}
          loading={state.isLookingUp}
          disabled={!state.manualSku.trim() || state.isLookingUp}
        />
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: '70%',
    height: 160,
    borderWidth: 2,
    borderRadius: 10,
  },
});
