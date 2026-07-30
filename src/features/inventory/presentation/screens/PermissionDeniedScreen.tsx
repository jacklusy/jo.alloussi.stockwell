import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ModalStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Button } from '@/ui/components/Button';
import { openAppSettings } from '@/services/permissions/camera';
import { t } from '@/i18n';

export type PermissionDeniedScreenProps = NativeStackScreenProps<
  ModalStackParamList,
  typeof Routes.PermissionDenied
>;

export function PermissionDeniedScreen({
  route,
  navigation,
}: PermissionDeniedScreenProps): React.JSX.Element {
  const permission = route.params.permission;
  const headline =
    permission === 'camera'
      ? t('permissions.cameraDeniedHeadline')
      : t('permissions.biometricsDeniedHeadline');
  const body =
    permission === 'camera'
      ? t('permissions.cameraDeniedBody')
      : t('permissions.biometricsDeniedBody');

  return (
    <Box flex={1} background="background" padding={4} gap={4} justify="center">
      <Text variant="h1">{headline}</Text>
      <Text variant="body" color="secondary">
        {body}
      </Text>
      <Button
        label={t('permissions.openSettings')}
        onPress={() => {
          void openAppSettings();
        }}
      />
      <Button
        label={t('permissions.useManual')}
        variant="secondary"
        onPress={() => {
          if (permission === 'camera') {
            navigation.replace(Routes.Scanner);
            return;
          }
          navigation.goBack();
        }}
      />
      <Button label={t('permissions.close')} variant="ghost" onPress={() => navigation.goBack()} />
    </Box>
  );
}
