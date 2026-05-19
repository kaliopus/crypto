export type ProtocolKey = 'aave-v3' | 'morpho-blue';

export type RiskLevel = 'none' | 'safe' | 'watch' | 'warning' | 'critical' | 'liquidatable' | 'unknown';

export type RescuePlan = {
  targetHealthFactor: number;
  repayToTargetBase: bigint | null;
  collateralToTargetBase: bigint | null;
  explanation: string;
  assumptions: string[];
};

export type PositionRisk = {
  protocolKey: ProtocolKey;
  chainKey: string;
  walletAddress: `0x${string}`;
  blockNumber?: bigint;
  healthFactor: number | null;
  healthFactorRaw?: string;
  totalCollateralBase?: bigint;
  totalDebtBase?: bigint;
  availableBorrowsBase?: bigint;
  currentLiquidationThreshold?: bigint;
  ltv?: bigint;
  riskLevel: RiskLevel;
  dangerReason: string;
  rescuePlan?: RescuePlan | null;
  raw: unknown;
};

export interface ProtocolAdapter {
  protocolKey: ProtocolKey;
  getPositionRisk(input: {
    walletAddress: `0x${string}`;
    chainKey: string;
    targetHealthFactor: number;
  }): Promise<PositionRisk>;
}
