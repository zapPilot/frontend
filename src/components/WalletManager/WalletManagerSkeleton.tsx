export function WalletManagerSkeleton() {
  return (
    <div
      className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="wallet-manager-loading"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <div className="h-5 w-40 bg-gray-800 rounded mb-4 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <div className="h-9 w-24 bg-gray-800 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
