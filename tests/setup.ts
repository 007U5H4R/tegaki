import { config } from 'dotenv'

// Tests read the same env as the app. `.env.test.local` wins when present so a
// developer can point the suite at a throwaway Supabase project without
// touching the values `next dev` uses.
config({ path: '.env.local', quiet: true })
config({ path: '.env.test.local', override: true, quiet: true })
