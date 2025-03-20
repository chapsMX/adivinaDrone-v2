import { createConnector } from "wagmi";
import sdk from "@farcaster/frame-sdk";

interface ExtendedUserContext {
  custody_address?: string;
}

type EthereumProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
};

export function frameConnector() {
  return createConnector<EthereumProvider>((config) => ({
    id: "farcaster",
    name: "Farcaster Wallet",
    type: "injected",
    async connect() {
      const provider = await this.getProvider();
      const accounts = await this.getAccounts();
      return {
        accounts,
        chainId: config.chains[0].id,
        provider,
      };
    },
    async disconnect() {
      // No-op as Farcaster doesn't support disconnecting
    },
    async getAccounts() {
      const context = await sdk.context;
      const user = context.user as ExtendedUserContext;
      if (!user?.custody_address) {
        throw new Error("No custody address found");
      }
      return [user.custody_address as `0x${string}`];
    },
    async getChainId() {
      return config.chains[0].id;
    },
    async getProvider() {
      return sdk.wallet.ethProvider as unknown as EthereumProvider;
    },
    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },
    async switchChain({ chainId }) {
      const provider = await this.getProvider();
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return config.chains.find((x) => x.id === chainId) ?? config.chains[0];
    },
    onAccountsChanged() {},
    onChainChanged() {},
    onDisconnect() {},
  }));
} 