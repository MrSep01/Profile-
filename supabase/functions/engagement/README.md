# Engagement Edge Function

This function provides secure write operations for:
- Toggle likes
- Post comments
- Report comments

It is used by `script.js` when `SUPABASE_CONFIG.edgeFunctionName` is set (default: `engagement`).

## Deploy

From project root:

```bash
supabase login
supabase link --project-ref zjqkzjepeqbjhzfytmcz
supabase functions deploy engagement
```

## Required secrets

```bash
supabase secrets set SUPABASE_URL=https://zjqkzjepeqbjhzfytmcz.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Optional bot protection:

```bash
supabase secrets set TURNSTILE_SECRET_KEY=YOUR_TURNSTILE_SECRET
```

## Client config

Update `supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://zjqkzjepeqbjhzfytmcz.supabase.co",
  anonKey: "sb_publishable_...",
  edgeFunctionName: "engagement",
  turnstileSiteKey: "" // Optional Cloudflare Turnstile site key
};
```
