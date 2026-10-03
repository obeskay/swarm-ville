import { randomUUID } from "node:crypto";

/**
 * The shared job queue: crowdfunding for agent work.
 *
 * Anyone can leave an objective, anyone else can back it, and the swarm always
 * works on the front of the line. This module knows nothing about sockets or
 * providers — `start`, `stop` and `emit` are injected — so the ordering rules
 * can be tested without a relay.
 *
 * A job is either the one running or waiting its turn. The running job is
 * always listed first; the waiting ones sort by backing, then by age, so a
 * popular job jumps the line but two equally popular ones stay first come,
 * first served.
 */

/**
 * @typedef {object} Job
 * @property {string} id
 * @property {string} goal
 * @property {string} ownerId
 * @property {string} ownerName
 * @property {string[]} backers peer ids
 * @property {{x: number, z: number} | null} at where the owner set their agent down
 * @property {"running" | "queued"} status
 * @property {number} createdAt
 * @property {string | null} runId null until the swarm has actually begun
 */

/**
 * @param {object} options
 * @param {(job: Job) => Promise<{id: string}>} options.start begins a run for the job
 * @param {(job: Job) => void} options.stop aborts the run of a job that has a runId
 * @param {(items: Job[]) => void} options.emit told the whole ordered list on every change
 * @param {{queueMax: number, jobsPerPeer: number}} options.limits
 */
export const createQueue = ({
  start,
  stop,
  emit,
  limits,
  now = Date.now,
  newId = () => `job_${randomUUID().slice(0, 8)}`
}) => {
  /** The job the swarm is on. Set before `start` resolves, so no one can slip in. */
  let running = null;
  /** Arrival order. `items()` sorts a copy, and a stable sort keeps ties in this order. */
  let waiting = [];

  const byBacking = (a, b) => b.backers.length - a.backers.length || a.createdAt - b.createdAt;

  // Clients and callbacks get copies, so nothing outside can edit a live job.
  const publicJob = (job) => ({
    id: job.id,
    goal: job.goal,
    ownerId: job.ownerId,
    ownerName: job.ownerName,
    backers: [...job.backers],
    at: job.at ? { ...job.at } : null,
    status: job.status,
    createdAt: job.createdAt,
    runId: job.runId
  });

  const items = () =>
    [...(running ? [running] : []), ...[...waiting].sort(byBacking)].map(publicJob);

  const changed = () => emit(items());

  const jobsOf = (ownerId) =>
    waiting.filter((job) => job.ownerId === ownerId).length + (running?.ownerId === ownerId ? 1 : 0);

  const drop = (match) => {
    const before = waiting.length;
    waiting = waiting.filter((job) => !match(job));
    if (waiting.length === before) return false;
    changed();
    return true;
  };

  /**
   * Gives the front job to the swarm when it is idle. Resolves to the run it
   * started, or is null when there was nothing to start. Callers emit.
   */
  const advance = () => {
    if (running || waiting.length === 0) return null;

    const job = [...waiting].sort(byBacking)[0];
    waiting = waiting.filter((candidate) => candidate !== job);
    job.status = "running";
    running = job;

    const started = (async () => start(publicJob(job)))().then(
      (run) => {
        job.runId = run.id;
        // Only if the job is still the current one: it may already have ended.
        if (running === job) {
          if (job.stopRequested) stop(publicJob(job));
          changed();
        }
        return run;
      },
      (error) => {
        // A job the swarm cannot start must not wedge everything behind it.
        if (running === job) {
          running = null;
          advance();
          changed();
        }
        throw error;
      }
    );
    // Whoever awaits `started` sees the failure; nobody else should crash on it.
    started.catch(() => {});
    return started;
  };

  // A stop that arrives before `start` resolves has no run to abort yet, so it
  // is remembered and applied the moment the run exists.
  const halt = () => {
    if (running.runId) stop(publicJob(running));
    else running.stopRequested = true;
    return true;
  };

  return {
    items,

    /**
     * Adds a job, starting it at once when the swarm is idle.
     * Throws `queue_full` or `too_many_jobs`.
     * @returns {{job: Job, started: Promise<{id: string}> | null}} `started`
     *   settles with the run when this job went straight to the swarm.
     */
    submit({ goal, ownerId, ownerName, at = null }) {
      if (waiting.length + (running ? 1 : 0) >= limits.queueMax) throw new Error("queue_full");
      if (jobsOf(ownerId) >= limits.jobsPerPeer) throw new Error("too_many_jobs");

      const job = {
        id: newId(),
        goal,
        ownerId,
        ownerName,
        backers: [],
        at,
        status: "queued",
        createdAt: now(),
        runId: null
      };
      waiting.push(job);
      const started = advance();
      changed();
      return { job: publicJob(job), started };
    },

    /** Toggles a peer's backing of a waiting job that is not their own. */
    back(peerId, id) {
      const job = waiting.find((candidate) => candidate.id === id);
      if (!job || job.ownerId === peerId) return false;

      const at = job.backers.indexOf(peerId);
      if (at === -1) job.backers.push(peerId);
      else job.backers.splice(at, 1);
      changed();
      return true;
    },

    /** Owner only: withdraws a waiting job, or stops it when it is the running one. */
    cancel(peerId, id) {
      if (running?.id === id) return running.ownerId === peerId && halt();
      return drop((job) => job.id === id && job.ownerId === peerId);
    },

    /** Stops the running job for its owner. Throws `not_your_run` for anyone else. */
    stopCurrent(peerId) {
      if (!running) return false;
      if (running.ownerId !== peerId) throw new Error("not_your_run");
      return halt();
    },

    /** The one hook the orchestrator calls, however the run ended. */
    finished(jobId) {
      if (running?.id !== jobId) return;
      running = null;
      advance();
      changed();
    },

    /**
     * Someone who leaves loses their waiting jobs and takes their backing with
     * them: a reconnect is a new peer id, so a ghost vote could never be undone.
     * The running job is left to finish: leaving an agent working and walking
     * away is the point.
     */
    dropOwner(ownerId) {
      let unbacked = false;
      for (const job of waiting) {
        const at = job.backers.indexOf(ownerId);
        if (at === -1) continue;
        job.backers.splice(at, 1);
        unbacked = true;
      }
      const dropped = drop((job) => job.ownerId === ownerId);
      if (unbacked && !dropped) changed();
      return dropped || unbacked;
    },

    /** Forgets every waiting job, so aborting the run on shutdown starts nothing new. */
    drain: () => drop(() => true)
  };
};
