import type { RebalanceMode } from "../types";

export const getChangesCount = (rebalanceMode?: RebalanceMode): number =>
  rebalanceMode?.data?.shifts.filter(shift => shift.action !== "maintain")
    .length ?? 0;
