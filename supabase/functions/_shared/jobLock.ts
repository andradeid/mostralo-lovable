interface SupabaseRpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

export interface JobLockHandle {
  ownerId: string;
  lockExpiresAt: string;
}

export async function acquireJobLock(
  supabase: SupabaseRpcClient,
  jobName: string,
  ttlSeconds = 300,
): Promise<JobLockHandle | null> {
  const { data, error } = await supabase.rpc("acquire_job_lock", {
    p_job_name: jobName,
    p_ttl_seconds: ttlSeconds,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.acquired || !row.owner_id) {
    return null;
  }

  return {
    ownerId: row.owner_id,
    lockExpiresAt: row.lock_expires_at,
  };
}

export async function releaseJobLock(
  supabase: SupabaseRpcClient,
  jobName: string,
  ownerId: string,
): Promise<void> {
  const { error } = await supabase.rpc("release_job_lock", {
    p_job_name: jobName,
    p_owner_id: ownerId,
  });

  if (error) {
    throw error;
  }
}