import liff from "@line/liff";

const LIFF_ID = import.meta.env.VITE_LIFF_ID;

export async function initLiff() {
  if (!LIFF_ID) {
    throw new Error("VITE_LIFF_ID is not set");
  }

  // Always make sure LIFF is initialized first
  if (!liff.isInitialized()) {
    await liff.init({ liffId: LIFF_ID });
  }

  // If not logged in yet, trigger login (this will redirect and come back)
  if (!liff.isLoggedIn()) {
    liff.login();
    // After login redirect, the app will be reloaded, so we can just return here.
    return;
  }
}

export async function getProfile() {
  await initLiff();
  // If login just happened, this may not run until after redirect.
  return liff.getProfile();
}

export function isInClient(): boolean {
  try {
    return liff.isInClient();
  } catch {
    return false;
  }
}
