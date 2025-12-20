import { Calendar } from "lucide-react";

import {
    Modal,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from "@/components/ui/modal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <ModalHeader
        title="Core Settings"
        subtitle="Connect services to enable automated rebalancing reminders tailored to your personal regime."
        onClose={onClose}
      />
      <ModalContent>
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                Google Calendar
              </div>
              <div className="text-xs text-gray-400">
                Remind me to rebalance
              </div>
            </div>
          </div>
          <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
            Connect
          </button>
        </div>
      </ModalContent>
      <ModalFooter className="justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
        >
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
}
