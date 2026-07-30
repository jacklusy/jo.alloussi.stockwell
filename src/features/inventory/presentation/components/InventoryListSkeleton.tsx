import React from 'react';

import { Box } from '@/ui/primitives/Box';
import { Skeleton } from '@/ui/feedback/Skeleton';

/** Row-shaped skeleton matching BalanceRow layout. */
export function BalanceRowSkeleton(): React.JSX.Element {
  return (
    <Box
      row
      align="center"
      gap={3}
      paddingY={3}
      paddingX={1}
      style={{ minHeight: 64 }}
      accessibilityLabel="Loading"
    >
      <Box style={{ width: 4, height: 40, borderRadius: 2, overflow: 'hidden' }}>
        <Skeleton width={4} height={40} />
      </Box>
      <Box flex={1} gap={2}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="45%" height={12} />
      </Box>
      <Skeleton width={48} height={20} />
    </Box>
  );
}

export type InventoryListSkeletonProps = {
  count?: number;
};

export function InventoryListSkeleton({
  count = 8,
}: InventoryListSkeletonProps): React.JSX.Element {
  return (
    <Box gap={1}>
      {Array.from({ length: count }).map((_, index) => (
        <BalanceRowSkeleton key={`sk-${index}`} />
      ))}
    </Box>
  );
}
