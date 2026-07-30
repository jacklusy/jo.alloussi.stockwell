import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

type Listener = (status: NetworkStatus) => void;

function toStatus(state: NetInfoState): NetworkStatus {
  return {
    isConnected: Boolean(state.isConnected),
    isInternetReachable: state.isInternetReachable,
  };
}

export const networkAdapter = {
  async getStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    return toStatus(state);
  },

  subscribe(listener: Listener): () => void {
    return NetInfo.addEventListener((state) => listener(toStatus(state)));
  },

  /** Reachable internet — Wi-Fi with no upstream is treated as offline. */
  async isOnline(): Promise<boolean> {
    const status = await this.getStatus();
    if (!status.isConnected) {
      return false;
    }
    if (status.isInternetReachable === false) {
      return false;
    }
    return true;
  },
};
