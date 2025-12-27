import { Search, X } from "lucide-react";
import { useState } from "react";

interface WalletSearchNavProps {
  onSearch: (address: string) => void;
  placeholder?: string;
  className?: string;
}

export function WalletSearchNav({
  onSearch,
  placeholder = "Search address...",
  className = "",
}: WalletSearchNavProps) {
  const [address, setAddress] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false); // Mobile toggle state

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onSearch(address.trim());
      setIsMobileExpanded(false); // Close on submit in mobile
    }
  };

  return (
    <>
      {/* Mobile Trigger Icon (Only visible on small screens when collapsed) */}
      <button
        type="button"
        onClick={() => setIsMobileExpanded(true)}
        className={`md:hidden p-2 text-gray-400 hover:text-white ${isMobileExpanded ? "hidden" : "block"} ${className}`}
        aria-label="Open search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Input (Visible on MD+, or when Mobile Expanded) */}
      {/* Search Input (Visible on MD+, or when Mobile Expanded) */}
      <form
        onSubmit={handleSubmit}
        className={`relative items-center transition-all duration-300 
          ${isMobileExpanded ? "flex w-full absolute left-0 top-0 h-16 bg-gray-950 px-4 z-50" : "hidden md:flex h-10"}
          ${isFocused ? "md:w-80" : "md:w-64"} 
          ${className}
        `}
      >
        {isMobileExpanded && (
           <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md -z-10" />
        )}

        <div
          className={`absolute inset-0 bg-gray-900/50 rounded-full border transition-colors ${
            isFocused ? "border-purple-500/50" : "border-gray-800"
          } ${isMobileExpanded ? "m-3 h-10" : "h-10"}`}
        />
        
        <Search className={`absolute w-4 h-4 text-gray-400 pointer-events-none ${isMobileExpanded ? "left-6" : "left-3"}`} />
        
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          // On mobile, autoFocus when expanded
          autoFocus={isMobileExpanded}
          className={`w-full bg-transparent border-none text-white text-sm placeholder-gray-500 focus:ring-0 z-10 ${
            isMobileExpanded ? "pl-12 pr-12 h-16" : "pl-9 pr-8 h-10"
          }`}
        />
        
        {/* Clear/Close Button */}
        {(address || isMobileExpanded) && (
          <button
            type="button"
            onClick={() => {
              if (address) {
                setAddress("");
              } else {
                setIsMobileExpanded(false);
              }
            }}
            className={`absolute text-gray-500 hover:text-white z-20 flex items-center justify-center ${
              isMobileExpanded ? "right-6 h-16 w-10" : "right-2 h-10 w-8"
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>
    </>
  );
}
