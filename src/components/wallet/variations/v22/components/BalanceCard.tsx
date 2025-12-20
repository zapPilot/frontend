import { ArrowDownCircle, ArrowUpCircle, ArrowUpRight } from "lucide-react";

interface BalanceCardProps {
  balance: number;
  roi: number;
  onOpenModal: (type: "deposit" | "withdraw") => void;
}

export function BalanceCard({ balance, roi, onOpenModal }: BalanceCardProps) {
  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 flex flex-col justify-center">
      <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">
        Net Worth
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <div
            className="text-5xl font-bold text-white tracking-tight mb-4"
            data-testid="net-worth"
          >
            ${balance.toLocaleString()}
          </div>
          <div className="flex items-center gap-3">
            <span
              className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded flex items-center gap-1"
              data-testid="performance-change"
            >
              <ArrowUpRight className="w-3 h-3" /> {roi}%
            </span>
            <span className="text-xs text-gray-500">All Time Return</span>
          </div>
        </div>
      </div>

      {/* Quick Actions - Moved to top for visibility on mobile */}
      <div className="grid grid-cols-2 gap-3">
        <button
          data-testid="deposit-button"
          onClick={() => onOpenModal("deposit")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold rounded-lg transition-colors border border-green-500/20"
        >
          <ArrowDownCircle className="w-4 h-4" /> Deposit
        </button>
        <button
          data-testid="withdraw-button"
          onClick={() => onOpenModal("withdraw")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors border border-red-500/20"
        >
          <ArrowUpCircle className="w-4 h-4" /> Withdraw
        </button>
      </div>
    </div>
  );
}
