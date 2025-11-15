import liff from "@line/liff";

const LIFF_ID = import.meta.env.VITE_LIFF_ID;

// We keep our own flag instead of calling liff.isInitialized()
let initialized = false;

export async function initLiff() {
  if (!LIFF_ID) {
    throw new Error("VITE_LIFF_ID is not set");
  }

  // Initialize LIFF only once per page load
  if (!initialized) {
    await liff.init({ liffId: LIFF_ID });
    initialized = true;
  }

  // If not logged in yet, trigger login (LIFF will redirect back)
  if (!liff.isLoggedIn()) {
    liff.login();
    // After login, the page will reload, so we can just return here.
    return;
  }
}

export async function getProfile() {
  await initLiff();
  // At this point LIFF should be initialized and logged in.
  return liff.getProfile();
}

// Optional helper if the app wants to check environment
export function isInClient(): boolean {
  try {
    return liff.isInClient();
  } catch {
    return false;
  }
}
