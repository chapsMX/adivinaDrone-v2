import { protoMono } from '@/styles/fonts';

interface PopupProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Popup({ message, isOpen, onClose }: PopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay con efecto de desenfoque */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Contenedor del popup */}
      <div className={`relative bg-[#3d3849] border-2 border-[#ff8800] rounded-xl p-6 max-w-md w-[95%] ${protoMono.className}`}>
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-white hover:text-[#ff8800] transition-colors"
        >
          ✕
        </button>
        
        {/* Mensaje */}
        <div className="text-white text-center mt-2">
          {message}
        </div>
      </div>
    </div>
  );
} 