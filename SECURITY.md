# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in BuildTrack, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email: **rwttarun9@gmail.com** with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

I will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | ✅ Current |
| < 0.2   | ❌ No longer supported |

## Security Best Practices

### Environment Variables

- **Never commit `.env` files** — they are gitignored
- The `VITE_SUPABASE_ANON_KEY` is a **public** key — it is safe to expose in client-side code. All data access is controlled by Supabase Row-Level Security (RLS) policies.
- The `SUPABASE_SERVICE_ROLE_KEY` is **private** — it must only be used in server-side code (Supabase Edge Functions). Never expose it in the frontend.

### Row-Level Security (RLS)

All 14 database tables have RLS policies enabled. Users can only access data they are authorised to see based on their `auth.uid()` and role.

### Authentication

- Authentication is handled entirely by Supabase Auth (JWT-based)
- Session tokens are stored in `localStorage` by the Supabase client
- Passwords are hashed by Supabase (bcrypt) — BuildTrack never sees raw passwords

### Third-Party Services

| Service | Data Shared | Purpose |
|---------|-------------|---------|
| Supabase | All app data | Database, auth, storage |
| Groq | Project summaries (no PII) | AI assistant responses |
| Vercel | Static assets only | Hosting |

## Disclosure Policy

Once a vulnerability is fixed, I will:
1. Release a patched version
2. Credit the reporter (unless they prefer anonymity)
3. Add a note to the CHANGELOG
