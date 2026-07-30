import React, { type PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Box, type BoxProps } from '@/ui/primitives/Box';

export type CardProps = PropsWithChildren<{
  testID?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: BoxProps['onTouchEnd'];
}>;

function CardRoot({ children, testID, style }: CardProps): React.JSX.Element {
  return (
    <Box
      {...(testID !== undefined ? { testID } : {})}
      background="surfaceRaised"
      radius="md"
      elevation="raised"
      {...(style !== undefined ? { style } : {})}
    >
      {children}
    </Box>
  );
}

function Header({ children }: PropsWithChildren): React.JSX.Element {
  return (
    <Box padding={4} paddingBottom={2}>
      {children}
    </Box>
  );
}

function Body({ children }: PropsWithChildren): React.JSX.Element {
  return <Box padding={4}>{children}</Box>;
}

function Footer({ children }: PropsWithChildren): React.JSX.Element {
  return (
    <Box padding={4} paddingTop={2} row align="center" justify="flex-end" gap={2}>
      {children}
    </Box>
  );
}

export const Card = Object.assign(CardRoot, { Header, Body, Footer });
