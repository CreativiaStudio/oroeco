"use client";

export interface ConsentCategories {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface ConsentRecord {
  consentId: string;
  visitorId: string;
  categories: ConsentCategories;
  timestamp: string;
  version: string;
}

const STORAGE_KEY = "oroeco_cookie_consent_v1";
const VISITOR_KEY = "oroeco_visitor_id";
export const POLICY_VERSION = "2026.1";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let vid = localStorage.getItem(VISITOR_KEY);
  if (!vid) {
    vid = "vid_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, vid);
  }
  return vid;
}

export function getStoredConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function updateGoogleConsentMode(categories: ConsentCategories) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      analytics_storage: categories.analytics ? "granted" : "denied",
      ad_storage: categories.marketing ? "granted" : "denied",
      ad_user_data: categories.marketing ? "granted" : "denied",
      ad_personalization: categories.marketing ? "granted" : "denied",
      functionality_storage: categories.preferences ? "granted" : "denied",
      personalization_storage: categories.preferences ? "granted" : "denied",
    });
  }
  // Dispatch custom event for Meta Pixel and other trackers
  window.dispatchEvent(new CustomEvent("oroeco_consent_updated", { detail: categories }));
}

export async function saveConsent(categories: ConsentCategories): Promise<ConsentRecord> {
  const visitorId = getVisitorId();
  const consentId = "csnt_" + Math.random().toString(36).substring(2, 14) + Date.now().toString(36);

  const record: ConsentRecord = {
    consentId,
    visitorId,
    categories: {
      necessary: true,
      analytics: Boolean(categories.analytics),
      marketing: Boolean(categories.marketing),
      preferences: Boolean(categories.preferences),
    },
    timestamp: new Date().toISOString(),
    version: POLICY_VERSION,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    updateGoogleConsentMode(record.categories);
  }

  // Record on Supabase server-side
  try {
    fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch((e) => console.warn("[Consent] Non-blocking server record error:", e));
  } catch (e) {
    // Non-blocking
  }

  return record;
}
