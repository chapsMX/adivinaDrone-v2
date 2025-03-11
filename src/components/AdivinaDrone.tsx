"use client";

import { useEffect, useCallback, useState } from "react";
// import { input } from"../compoonents/ui/input";
// import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, {
AddFrame,
FrameNotificationDetails,
// SignIn as SignInCore,
type Context,
} from "@farcaster/frame-sdk";

import { Button } from "../styles/ui/Button";
// import { useSession } from "next-auth/react";
import { createStore} from "mipd";
import { protoMono } from '@/styles/fonts';
import Image from 'next/image';
import { InstagramIcon, TikTokIcon } from '@/styles/svg';
import '@/styles/footer.css';

export default function AdivinaDrone(
  { title }: { title?: string } = { title: "adivinaDrone" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  //const [isContextOpen, setIsContextOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] =
    useState<FrameNotificationDetails | null>(null);
  const [addFrameResult, setAddFrameResult] = useState("");

  // contexto del frame
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      setAdded(context.client.added);

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
        if (notificationDetails) {
          setNotificationDetails(notificationDetails);
        }
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log(`Frame add rejected: ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        setAdded(false);
        setNotificationDetails(null);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        setNotificationDetails(notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        setNotificationDetails(null);
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const addFrame = useCallback(async () => {
    try {
      setNotificationDetails(null);

      const result = await sdk.actions.addFrame();

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails);
      }
      setAddFrameResult(
        result.notificationDetails
          ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
          : "Added, got no notification details"
      );
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);
/*   // envia notificacion
  const sendNotification = useCallback(async () => {
    setSendNotificationResult("");
    if (!notificationDetails || !context) {
      return;
    }

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        mode: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: context.user.fid,
          notificationDetails,
        }),
      });

      if (response.status === 200) {
        setSendNotificationResult("Success");
        return;
      } else if (response.status === 429) {
        setSendNotificationResult("Rate limited");
        return;
      }

      const data = await response.text();
      setSendNotificationResult(`Error: ${data}`);
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
    }
  }, [context, notificationDetails]); */

  // carga el componente
  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-[#2d283a] text-white font-mono flex flex-col">
      <header className={`w-full p-4 flex justify-between items-center ${protoMono.className}`}>
        <div className="flex items-center">
          <Image
            src="/favicon.png"
            alt="adivinaDrone Logo"
            width={64}
            height={64}
            priority
          />
        </div>
        {context?.user && context.user.pfpUrl && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#ff8800] rounded-full text-white min-w-[150px]">
              <Image
                src={context.user.pfpUrl}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full border-2 border-white"
                unoptimized
              />
              <span className="text-left">{context.user.username}</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center p-2">
        <div className="flex flex-col items-center gap-3">
          <div className="w-[300px] mx-auto">
            <h1 className="text-2xl font-bold text-center mb-1">{title}</h1>

            <div>
{/*           <div className="mb-4">
            <SignIn />
          </div> */}
        </div>

      </div>
          {/* fin de signIn */}
          <div className="relative border-2 border-[#ff8800] bg-[#3d3849] rounded-2xl p-6 max-w-2xl w-full overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Image
                src="/mapaTrans.png"
                alt="Background Map"
                fill
                style={{ objectFit: 'cover' }}
                className="opacity-80"
              />
            </div>
            <div className={`relative z-10 text-center space-y-3 ${protoMono.className}`}>
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-bold">adivinaDrone</h1>
                <h2 className="text-4xl font-semibold opacity-90">Season 07</h2>
              </div>
              
              <p className="text-lg leading-relaxed mt-3">
                Think you know the world? <br /> Take the ultimate guess in our photo challenge!
              </p>
              <h2 className="text-3xl font-semibold opacity-90">Coming Soon!</h2>
            </div>
          </div>

          <div className={`flex flex-col items-center gap-3 w-full max-w-2xl ${protoMono.className}`}>
            <div className="relative">
              <p className="text-2xl font-white text-white tracking-[0.2em]">
               Follow us:
              </p>
            </div>
            
            <div className="flex gap-4 w-full">
              <Button
                onClick={() => window.open('https://www.instagram.com/c13studio/', '_blank')}
                className="flex-1"
              >
                <InstagramIcon />
                Instagram
              </Button>

              <Button
                onClick={() => window.open('https://www.tiktok.com/@c13studio', '_blank')}
                className="flex-1"
              >
                <TikTokIcon />
                TikTok
              </Button>
            </div>

            <div className="w-full mt-1">
            <Button onClick={addFrame} disabled={added} className="w-full">
                  Add frame to client
                </Button><br />
              {/* <h2 className="font-2xl font-bold text-left">Add to client & notifications</h2> */}

            <div className="mt-2 mb-4 text-xs text-left opacity-50">
                Client fid {context?.client.clientFid},
                {added ? " frame added to client," : " frame not added to client,"}
                {notificationDetails
                  ? " notifications enabled"
                  : " notifications disabled"}
              </div>

              <div className="mb-4">
                {addFrameResult && (
                  <div className="mb-2 text-xs text-left opacity-50">
                    Add frame result: {addFrameResult}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full overflow-hidden py-2 mb-4">
        <div className="relative flex flex-col gap-0.5">
          <div className="marquee">
            <div className="track">
              <span className={`text-white text-xl ${protoMono.className}`}>
                c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio •&nbsp;
              </span>
              <span className={`text-white text-xl ${protoMono.className}`}>
                c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio •&nbsp;
              </span>
            </div>
          </div>
          <div className="marquee">
            <div className="track-reverse">
              <span className={`text-white text-xl ${protoMono.className}`}>
                adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone •&nbsp;
              </span>
              <span className={`text-white text-xl ${protoMono.className}`}>
                adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone •&nbsp;
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// sign in farcaster
/* function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInResult, setSignInResult] = useState<SignInCore.SignInResult>();
  const [signInFailure, setSignInFailure] = useState<string>();
  const { data: session, status } = useSession();

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });
      setSignInResult(result);

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Rejected by user");
        return;
      }

      setSignInFailure("Unknown error");
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false });
      setSignInResult(undefined);
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <>
      {status !== "authenticated" && (
        <Button onClick={handleSignIn} disabled={signingIn}>
          Sign In with Farcaster
        </Button>
      )}
      {status === "authenticated" && (
        <Button onClick={handleSignOut} disabled={signingOut}>
          Sign out
        </Button>
      )}
      {session && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">Session</div>
          <div className="whitespace-pre">
            {JSON.stringify(session, null, 2)}
          </div>
        </div>
      )}
      {signInFailure && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{signInFailure}</div>
        </div>
      )}
      {signInResult && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">
            {JSON.stringify(signInResult, null, 2)}
          </div>
        </div>
      )}
    </>
  );
} */