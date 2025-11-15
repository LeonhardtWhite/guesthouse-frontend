import liff from "@line/liff";

const LIFF_ID = import.meta.env.VITE_LIFF_ID;
let initPromise: Promise<void> | null = null;

export async function initLiff(): Promise<void> {
  if (!LIFF_ID) {
    throw new Error("VITE_LIFF_ID is not set");
  }

  if (!liff.isInClient() && !liff.isLoggedIn()) {
    liff.login();
    return;
  }

  if (!liff.isInitialized()) {
    if (!initPromise) {
      initPromise = liff.init({ liffId: LIFF_ID });
    }
    await initPromise;
  }
}

export async function getProfile() {
  await initLiff();
  return liff.getProfile();
}
