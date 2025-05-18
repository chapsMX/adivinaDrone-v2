import type { Abi, Address } from "viem";
import { base } from "viem/chains";

/**
 * NFT Metadata Configuration
 */
export const mintMetadata = {
  name: "adivinaDrone Season 07",
  description:
    "Commemorative NFT for AdivinaDrone Season 7, a 30-day challenge where Farcaster players guessed real-world locations from drone photos.",
  imageUrl: "/adivinaDrone_01.jpg",
  creator: {
    name: "chaps",
    fid: 20701,
    profileImageUrl: "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/cae1d197-6bbc-49c9-67d0-61b635edf700/original",
  },
  chain: "Base",
  priceEth: "0.0004",
  startsAt: new Date("2025-03-18T12:00:00-06:00"),
  endsAt: new Date("2025-05-25T12:21:00-06:00"),
  isMinting: true,
} as const;

/**
 * Contract Configuration
 */
export const contractConfig = {
  address: "0x8087039152c472Fa74F47398628fF002994056EA" as Address,
  chain: base,
  abi: [
    { inputs: [], name: "MintPaused", type: "error" },
    { inputs: [], name: "InvalidPaymentAmount", type: "error" },
    { inputs: [], name: "SenderNotDirectEOA", type: "error" },
    {
      inputs: [
        { internalType: "uint256", name: "vectorId", type: "uint256" },
        { internalType: "uint48", name: "numTokensToMint", type: "uint48" },
        { internalType: "address", name: "mintRecipient", type: "address" },
      ],
      name: "vectorMint721",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "vectorId",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "contractAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "bool",
          name: "onChainVector",
          type: "bool",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "numMinted",
          type: "uint256",
        },
      ],
      name: "NumTokenMint",
      type: "event",
    },
  ] as const as Abi,
  vectorId: 6779,
  referrer: "0xd5d94f926640cCDf6CC018A058a039C8D5EB045c" as Address,
} as const;

/**
 * Farcaster Frame Embed Configuration
 */
export const embedConfig = {
  version: "next",
  imageUrl: "https://adivinadrone.c13studio.mx/adivinaDrone_01.jpg",
  button: {
    title: "Mint",
    action: {
      type: "launch_frame",
      name: "NFT Mint",
      url: "https://adivinadrone.c13studio.mx",
    },
  },
} as const;

/**
 * Main App Configuration
 */
export const config = {
  ...mintMetadata,
  contract: contractConfig,
  embed: embedConfig,
} as const;