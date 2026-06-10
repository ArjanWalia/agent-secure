# Orbit — demo project workspace

This is the sandboxed workspace the AGENT:SECURE worker agent operates on.
It contains a small fictional project ("Orbit", a tiny status-page service)
with files spanning the full sensitivity range, so the Importance-Scan model
has something meaningful to profile:

- `src/` — application code (important, not private)
- `config/settings.json` — service configuration (moderately sensitive)
- `secrets/credentials.env` — FAKE placeholder credentials (critical privacy)
- `data/customers.csv` — FAKE sample customer records (critical privacy)
- `notes/roadmap.md` — planning notes (low sensitivity)

All credentials and personal data in here are fabricated examples.
