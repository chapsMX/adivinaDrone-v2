import { protoMono } from '@/styles/fonts';

interface PopupProps {
  message: string;
  onClose: () => void;
  hasPerfectScore?: boolean;
  canBuyExtraLife?: boolean;
  onBuyExtraLife?: () => void;
}

export default function Popup({ message, onClose, hasPerfectScore, canBuyExtraLife, onBuyExtraLife }: PopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2d283a] p-6 rounded-xl max-w-md w-full mx-4 border-2 border-[#ff8800]">
        <p className="text-white text-center mb-6">{message}</p>
        
        {canBuyExtraLife && onBuyExtraLife && (
          <button
            onClick={onBuyExtraLife}
            className="w-full bg-[#ff8800] text-white py-2 rounded-lg mb-4 hover:bg-[#e67a00] transition-colors"
          >
            Buy Extra Life
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full bg-transparent border-2 border-[#ff8800] text-white py-2 rounded-lg hover:bg-[#3d3849] transition-colors"
        >
          {hasPerfectScore ? "See you tomorrow!" : "Close"}
        </button>
      </div>
    </div>
  );
} 