import React, { forwardRef, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

export type BottomSheetProps = {
  title?: string;
  children: ReactNode;
  snapPoints?: Array<string | number>;
  onDismiss?: () => void;
  testID?: string;
};

export const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(
  function StockwellBottomSheet(
    { title, children, snapPoints: snapPointsProp, onDismiss, testID },
    ref,
  ) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => snapPointsProp ?? ['40%', '70%'], [snapPointsProp]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        {...(onDismiss ? { onDismiss } : {})}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border.strong }}
        backgroundStyle={{
          backgroundColor: theme.colors.surface.surfaceRaised,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
        }}
      >
        <BottomSheetView
          testID={testID}
          style={[styles.content, { paddingBottom: Math.max(insets.bottom, theme.space[4]) }]}
        >
          {title ? (
            <Box paddingX={4} paddingBottom={3}>
              <Text variant="h3">{title}</Text>
            </Box>
          ) : null}
          <Box paddingX={4}>{children}</Box>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export { BottomSheetModalProvider };

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
