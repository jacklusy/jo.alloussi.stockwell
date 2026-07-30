import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Pressable } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

type ToastItem = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastApi = {
  show: (message: string, options?: { actionLabel?: string; onAction?: () => void }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setQueue((q) => q.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, options?: { actionLabel?: string; onAction?: () => void }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: ToastItem = {
        id,
        message,
        ...(options?.actionLabel !== undefined ? { actionLabel: options.actionLabel } : {}),
        ...(options?.onAction !== undefined ? { onAction: options.onAction } : {}),
      };
      setQueue((q) => [...q, item]);
      const timer = setTimeout(() => dismiss(id), 3500);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);
  const current = queue[0];

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current ? (
        <Animated.View
          entering={FadeInUp.duration(250)}
          exiting={FadeOutUp.duration(250)}
          style={{
            position: 'absolute',
            start: theme.space[4],
            end: theme.space[4],
            top: insets.top + theme.space[2],
            zIndex: 1000,
          }}
          accessibilityLiveRegion="polite"
        >
          <Box
            row
            align="center"
            justify="space-between"
            gap={3}
            padding={4}
            background="surfaceRaised"
            radius="md"
            elevation="overlay"
            border="subtle"
          >
            <Box flex={1}>
              <Text variant="bodySm" color="primary">
                {current.message}
              </Text>
            </Box>
            {current.actionLabel && current.onAction ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={current.actionLabel}
                onPress={() => {
                  current.onAction?.();
                  dismiss(current.id);
                }}
                style={{ minHeight: 48, justifyContent: 'center' }}
              >
                <Text variant="label" color="warning">
                  {current.actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </Box>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
