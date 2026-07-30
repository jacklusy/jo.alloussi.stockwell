import React, { useState } from 'react';
import { ScrollView } from 'react-native';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import {
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  ListRow,
  QuantityStepper,
  SearchBar,
} from '@/ui/components';
import { OfflineBanner, Skeleton, StateView, SyncStatusIndicator } from '@/ui/feedback';
import { Icon } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';

/** Dev-only visual review surface for the design system. */
export function ComponentGalleryScreen(): React.JSX.Element {
  const theme = useTheme();
  const [qty, setQty] = useState(10);
  const [search, setSearch] = useState('');

  return (
    <Box flex={1} background="background">
      <OfflineBanner visible />
      <ScrollView contentContainerStyle={{ padding: theme.space[4], gap: theme.space[6] }}>
        <Text variant="h1">Component gallery</Text>
        <SyncStatusIndicator status={{ kind: 'pending', count: 3 }} />

        <Box gap={2}>
          <Text variant="h3">Buttons</Text>
          <Button label="Primary" onPress={() => undefined} />
          <Button label="Secondary" variant="secondary" onPress={() => undefined} />
          <Button label="Loading" loading onPress={() => undefined} />
          <Button label="Disabled" disabled onPress={() => undefined} />
          <IconButton
            icon={<Icon name="settings" size={22} color={theme.colors.text.primary} />}
            accessibilityLabel="Settings"
            onPress={() => undefined}
          />
        </Box>

        <Box gap={2}>
          <Text variant="h3">Inputs</Text>
          <Input label="SKU" placeholder="Enter SKU" />
          <Input label="With error" error="Required" />
          <SearchBar value={search} onChangeText={setSearch} />
        </Box>

        <Box gap={2}>
          <Text variant="h3">Card / List / Badge</Text>
          <Card>
            <Card.Header>
              <Text variant="h3">Card title</Text>
            </Card.Header>
            <Card.Body>
              <Text variant="body" color="secondary">
                Body copy for operators.
              </Text>
            </Card.Body>
            <Card.Footer>
              <Button label="OK" size="sm" onPress={() => undefined} />
            </Card.Footer>
          </Card>
          <ListRow
            title="Balance row"
            subtitle="Pending sync"
            syncRailColor={theme.colors.sync.pending}
            chevron
            onPress={() => undefined}
          />
          <Box row gap={2}>
            <Badge label="Pending" variant="sync-pending" icon="●" />
            <Badge label="Conflict" variant="sync-conflict" icon="!" />
          </Box>
        </Box>

        <Box gap={2}>
          <Text variant="h3">Quantity stepper</Text>
          <QuantityStepper value={qty} onChange={setQty} min={0} max={999} />
        </Box>

        <Box gap={2}>
          <Text variant="h3">Skeleton</Text>
          <Skeleton width="100%" height={20} />
          <Skeleton width="60%" height={20} />
        </Box>

        <Box style={{ minHeight: 220 }}>
          <StateView
            kind="empty"
            headline="Everything synced"
            body="No pending mutations in the queue."
          />
        </Box>
      </ScrollView>
    </Box>
  );
}
