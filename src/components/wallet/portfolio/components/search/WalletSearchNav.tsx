import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobileExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobileExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onSearch(address.trim());
      setIsMobileExpanded(false); // Close on submit in mobile
    }
  };

  return (
    <>
      {/* Mobile Trigger - Modernized */}
      <button
        type="button"
        onClick={() => setIsMobileExpanded(true)}
        className={`md:hidden p-2 text-gray-400 hover:text-white transition-colors 
          ${isMobileExpanded ? "hidden" : "block"} ${className}`}
        aria-label="Open search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Input Container */}
      <form
        onSubmit={handleSubmit}
        className={`
          relative flex items-center transition-all duration-300 ease-in-out
          ${
            isMobileExpanded
              ? "fixed inset-x-0 top-0 h-16 bg-gray-950/95 backdrop-blur-xl px-4 z-50 border-b border-gray-800"
              : "hidden md:flex h-10"
          }
          ${isFocused ? "md:w-80" : "md:w-64"} 
          ${className}
        `}
      >
        {/* Input Wrapper with Modern Styling */}
        <div
          className={`
          relative flex items-center w-full h-full
          ${!isMobileExpanded && "bg-gray-900/50 hover:bg-gray-900/80 border border-gray-800 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 rounded-xl transition-all"}
        `}
        >
          <Search
            className={`
            absolute w-4 h-4 pointer-events-none transition-colors duration-200
            ${isMobileExpanded ? "left-0 text-gray-400" : "left-3"}
            ${isFocused ? "text-purple-400" : "text-gray-500"}
          `}
          />

          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`
              w-full bg-transparent border-none text-white text-sm placeholder-gray-500 
              focus:ring-0 focus:outline-none transition-all
              ${isMobileExpanded ? "pl-8 pr-10 h-full text-base" : "pl-9 pr-8 h-full"}
            `}
          />

          {/* Clear/Close Button */}
          {(address || isMobileExpanded) && (
            <button
              type="button"
              onMouseDown={e => {
                // Prevent losing focus when clicking clear
                e.preventDefault();
              }}
              onClick={e => {
                if (address) {
                  setAddress("");
                  // Keep focus on input if just clearing
                  if (!isMobileExpanded) {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    input?.focus();
                  }
                } else {
                  setIsMobileExpanded(false);
                }
              }}
              className={`
                absolute right-0 p-2 text-gray-500 hover:text-white transition-colors
                ${isMobileExpanded ? "mr-0" : "mr-1"}
              `}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </>
  );
}
