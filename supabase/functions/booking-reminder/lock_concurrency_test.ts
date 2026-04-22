import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { acquireJobLock, releaseJobLock } from "../_shared/jobLock.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("job lock allows only one concurrent acquisition per job", async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const jobName = `test-job-lock-${crypto.randomUUID()}`;

  const attempts = await Promise.all(
    Array.from({ length: 8 }, () => acquireJobLock(supabase, jobName, 60)),
  );

  const winners = attempts.filter((result) => result !== null);

  assertEquals(winners.length, 1, "apenas uma chamada deve adquirir o lock");
  assertExists(winners[0]?.ownerId, "o vencedor precisa ter ownerId");

  await releaseJobLock(supabase, jobName, winners[0]!.ownerId);

  const reacquired = await acquireJobLock(supabase, jobName, 60);
  assertExists(reacquired, "o lock deve poder ser adquirido novamente após release");

  await releaseJobLock(supabase, jobName, reacquired!.ownerId);
});