export interface JobRunHandle {
  startedAt: number;
  startedAtIso: string;
}

type JobEvent = "started" | "completed" | "skipped" | "failed";

export function createJobRun(jobName: string, metadata: Record<string, unknown> = {}): JobRunHandle {
  const startedAt = Date.now();
  const startedAtIso = new Date(startedAt).toISOString();

  logJobEvent(jobName, "started", {
    started_at: startedAtIso,
    ...metadata,
  });

  return {
    startedAt,
    startedAtIso,
  };
}

export function completeJobRun(
  jobName: string,
  run: JobRunHandle,
  status: JobEvent,
  metadata: Record<string, unknown> = {},
): void {
  logJobEvent(jobName, status, {
    started_at: run.startedAtIso,
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - run.startedAt,
    ...metadata,
  });
}

function logJobEvent(jobName: string, event: JobEvent, metadata: Record<string, unknown>): void {
  console.log(`[${jobName}] ${JSON.stringify({ job: jobName, event, ...metadata })}`);
}