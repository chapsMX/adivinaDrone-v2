import { erc20Abi, parseUnits } from 'viem';

export const TOKEN_ADDRESS = '0x2d6E6f029EA1b9298FE3DCc48290FF4BB4110CB2' as const;
export const LIFE_COST = parseUnits('2500000', 18);

export const tokenContract = {
  address: TOKEN_ADDRESS,
  abi: erc20Abi,
  name: 'DRONE',
  contract: '0x2d6E6f029EA1b9298FE3DCc48290FF4BB4110CB2',
} as const; 