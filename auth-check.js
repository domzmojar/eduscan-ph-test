// EduScan PH — auth-check.js
// Shared cache + verification + access-tier logic used by BOTH index.html
// (login/phone-verify gate) and app.html (the actual PWA). Keeping this in
// one file means the two pages can never drift out of sync on what counts
// as "verified" or "active access" — they read/write the exact same
// localStorage caches.
//
// Load this BEFORE any page-specific script that calls these functions.
// Requires `supabaseClient` to already be set on window by the page's own
// initSupabase() call (this file does not create a Supabase client itself).

const TRIAL_DAYS = 7;

// ── PHONE VERIFICATION CACHE ────────────────────────────────────────────
// Verification is permanent once granted, so caching this forever per-user
// is safe and lets a previously-verified teacher open the app offline
// without getting stuck behind the phone-verify gate.
const PHONE_VERIFIED_CACHE_KEY = 'edu_phone_verified_cache';

function getCachedPhoneVerified(userId) {
    try {
        const cache = JSON.parse(localStorage.getItem(PHONE_VERIFIED_CACHE_KEY)) || {};
        return !!cache[userId];
    } catch (e) { return false; }
}

function setCachedPhoneVerified(userId) {
    try {
        const cache = JSON.parse(localStorage.getItem(PHONE_VERIFIED_CACHE_KEY)) || {};
        cache[userId] = true;
        localStorage.setItem(PHONE_VERIFIED_CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* storage full or disabled — non-fatal */ }
}

// Returns true/false. Requires an RLS SELECT policy on verified_phones
// scoped to `user_id = auth.uid()` (own row only) — see setup notes.
async function checkPhoneVerified(userId) {
    if (getCachedPhoneVerified(userId)) return true;

    try {
        const { data, error } = await supabaseClient
            .from('verified_phones')
            .select('phone_e164')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        if (data) {
            setCachedPhoneVerified(userId);
            return true;
        }
        return false;
    } catch (e) {
        console.warn('Phone verification check failed, defaulting to unverified:', e.message || e);
        // Not cached + can't reach Supabase: show the gate rather than let
        // an unverified account through. Edge case this misses: an already-
        // verified teacher's very first load on a brand-new device while
        // offline — rare, and they just verify again (still blocked from a
        // second trial by the server-side UNIQUE constraint either way).
        return false;
    }
}

// ── ACCESS GATING: trial / lifetime status ────────────────────────────────
// Result is cached in localStorage so offline sessions still get a verdict
// without needing a live round-trip to Supabase every load.
const ACCESS_CACHE_KEY = 'edu_access_cache';

function getCachedAccess() {
    try { return JSON.parse(localStorage.getItem(ACCESS_CACHE_KEY)) || null; }
    catch (e) { return null; }
}

function setCachedAccess(data) {
    try { localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify(data)); }
    catch (e) { /* storage full or disabled — non-fatal */ }
}

// Computes the user's effective status from a profiles row.
// Returns { tier: 'lifetime'|'trial'|'expired', daysLeft }
function resolveAccess(profile) {
    if (!profile) return { tier: 'trial', daysLeft: TRIAL_DAYS }; // row not synced yet — be lenient, don't lock out
    if (profile.access_tier === 'lifetime') return { tier: 'lifetime', daysLeft: null };

    const started = new Date(profile.trial_started_at);
    const msElapsed = Date.now() - started.getTime();
    const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
    const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysElapsed));

    if (daysElapsed >= TRIAL_DAYS) return { tier: 'expired', daysLeft: 0 };
    return { tier: 'trial', daysLeft };
}