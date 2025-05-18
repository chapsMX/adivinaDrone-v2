"use client";

import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";

import { ArtworkCard } from "../app/api/mint/app/artworkCard";
import { CollectButton } from "../app/api/mint/app/collectButton";
import { MintErrorSheet } from "../app/api/mint/app/mintErrorSheet";
import { MintSuccessSheet } from "../app/api/mint/app/mintSuccessSheet";
import { mintMetadata } from "@/lib/config";

function FCMint() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <div className="w-full min-h-screen flex flex-col">
      <ArtworkCard
        imageUrl={mintMetadata.imageUrl}
        name={mintMetadata.name}
        creator={{
          name: mintMetadata.creator.name,
          profileImageUrl: mintMetadata.creator.profileImageUrl,
          fid: mintMetadata.creator.fid,
        }}
        chain={mintMetadata.chain}
        description={mintMetadata.description}
        isMinting={mintMetadata.isMinting}
      >
        <CollectButton
          priceEth={mintMetadata.priceEth}
          isMinting={mintMetadata.isMinting}
          onCollect={() => setShowSuccess(true)}
          onError={setError}
        />
      </ArtworkCard>
      <MintSuccessSheet
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        name={mintMetadata.name}
        imageUrl={mintMetadata.imageUrl}
      />
      <MintErrorSheet
        isOpen={!!error}
        onClose={() => setError(undefined)}
        error={error}
      />
    </div>
  );
}

export default FCMint;