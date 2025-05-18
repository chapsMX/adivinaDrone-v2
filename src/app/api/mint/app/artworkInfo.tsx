import { sdk } from "@farcaster/frame-sdk";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useCallback } from "react";
import { protoMono } from '@/styles/fonts';

interface ArtworkInfoProps {
  name: string;
  creator: {
    name: string;
    profileImageUrl?: string;
    fid?: number;
  };
  chain: string;
  description?: string;
  isMinting: boolean;
}

export function ArtworkInfo({ name, creator, chain, description, isMinting }: ArtworkInfoProps) {
  const handleViewProfile = useCallback(() => {
    if (creator.fid) {
      sdk.actions.viewProfile({
        fid: creator.fid,
      });
    }
  }, [creator.fid]);

  return (
    <div className="p-2">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-1">
        <h1 className={`text-xl font-semibold ${protoMono.className}`}>{name}</h1>
        <div className="flex flex-row items-center gap-1">
          <div className="flex items-center gap-1">
            <span className={`text-sm text-muted ${protoMono.className}`}>by</span>
            <button
              type="button"
              onClick={handleViewProfile}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              {creator.profileImageUrl && (
                <Avatar className="h-4 w-4 bg-secondary rounded-full">
                  <AvatarImage src={creator.profileImageUrl} alt={creator.name} />
                </Avatar>
              )}
              <span className={`text-sm ${protoMono.className}`}>{creator.name}</span>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-sm text-muted ${protoMono.className}`}>on</span>
            <Avatar className="h-4 w-4 bg-secondary rounded-full">
              <AvatarImage src="/base-logo.png" alt="Base" />
            </Avatar>
            <span className={`text-sm ${protoMono.className}`}>{chain}</span>
          </div>
        </div>
      </div>
    </div>

    <p className={`text-sm mb-4 ${protoMono.className}`}>
      {isMinting
        ? description
        : "This mint is closed. Don't miss the next one! Add this frame to get featured mint notifications."}
    </p>
  </div>
  );
}