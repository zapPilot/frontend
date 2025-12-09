export interface PoolDetail {
  wallet: string;
  protocol_id: string;
  protocol: string;
  protocol_name: string;
  chain: string;
  asset_usd_value: number;
  pool_symbols: string[];
  contribution_to_portfolio: number;
  snapshot_id: string;
  snapshot_ids?: string[] | null | undefined;
}
