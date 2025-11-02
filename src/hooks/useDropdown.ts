import { useCallback,useState } from "react";

/**
 * Return type for the useDropdown hook
 */
interface UseDropdownReturn {
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Function to open the dropdown */
  open: () => void;
  /** Function to close the dropdown */
  close: () => void;
  /** Function to toggle the dropdown state */
  toggle: () => void;
}

/**
 * Custom hook for managing dropdown/toggle state
 *
 * Provides a consistent interface for managing dropdown, modal, or expandable component states.
 * Eliminates duplicate state management code across components.
 *
 * @param initialState - Initial state of the dropdown (default: false)
 * @returns Object with isOpen state and control functions
 *
 * @example
 * ```tsx
 * // Basic usage
 * const dropdown = useDropdown();
 *
 * return (
 *   <div>
 *     <button onClick={dropdown.toggle}>
 *       {dropdown.isOpen ? 'Close' : 'Open'}
 *     </button>
 *     {dropdown.isOpen && <div>Dropdown content</div>}
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // With initial state
 * const dropdown = useDropdown(true); // starts open
 *
 * // Manual control
 * <button onClick={dropdown.open}>Open</button>
 * <button onClick={dropdown.close}>Close</button>
 * ```
 */
export const useDropdown = (
  initialState = false
): UseDropdownReturn => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};
