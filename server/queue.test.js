import test from "node:test";
import assert from "node:assert/strict";

import { createQueue } from "./queue.js";

/**
 * A queue wired to fakes. `start` hands out run ids and remembers the jobs it
 * was given; a test ends a run by calling `queue.finished(job.id)`, which is
 * exactly what the orchestrator's end-of-run hook does.
 */
const setup = (limits = { queueMax: 12, jobsPerPeer: 2 }) => {
  let clock = 0;
  let serial = 0;
  const started = [];
  const stopped = [];
  const emitted = [];
  const queue = createQueue({
    limits,
    now: () => (clock += 1),
    newId: () => `j${(serial += 1)}`,
    start: async (job) => {
      started.push(job.id);
      return { id: `run_${job.id}` };
    },
    stop: (job) => stopped.push(job.runId),
    emit: (items) => emitted.push(items)
  });
  const submit = (ownerId, goal = `goal of ${ownerId}`) =>
    queue.submit({ goal, ownerId, ownerName: ownerId.toUpperCase() });
  const ids = () => queue.items().map((job) => job.id);
  return { queue, submit, ids, started, stopped, emitted };
};

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("the first job starts at once and is listed as running", async () => {
  const { submit, queue, started } = setup();

  const { job, started: run } = submit("a");

  assert.equal(job.status, "running");
  assert.deepEqual(await run, { id: "run_j1" });
  assert.deepEqual(started, ["j1"]);
  assert.equal(queue.items()[0].runId, "run_j1");
  assert.equal(queue.items()[0].ownerName, "A");
});

test("later jobs wait, and a second submit while starting does not start twice", async () => {
  const { submit, ids, started } = setup();

  submit("a");
  // `start` has not resolved yet: the job must already count as running.
  const second = submit("b");
  await settle();

  assert.equal(second.started, null);
  assert.equal(second.job.status, "queued");
  assert.deepEqual(started, ["j1"]);
  assert.deepEqual(ids(), ["j1", "j2"]);
});

test("waiting jobs sort by backers, then by age; the running job stays first", () => {
  const { submit, queue, ids } = setup({ queueMax: 12, jobsPerPeer: 5 });

  submit("a"); // j1 runs
  submit("b"); // j2
  submit("c"); // j3
  submit("d"); // j4
  assert.deepEqual(ids(), ["j1", "j2", "j3", "j4"]);

  queue.back("a", "j4");
  assert.deepEqual(ids(), ["j1", "j4", "j2", "j3"]);

  queue.back("b", "j3");
  queue.back("d", "j3");
  // j3 has two, j4 has one: backing beats age.
  assert.deepEqual(ids(), ["j1", "j3", "j4", "j2"]);

  // Backing the running job is not possible, so it cannot be outranked.
  assert.equal(queue.back("c", "j1"), false);
  assert.equal(queue.items()[0].id, "j1");
});

test("equally backed jobs keep first come, first served", () => {
  const { submit, queue, ids } = setup({ queueMax: 12, jobsPerPeer: 5 });

  submit("a");
  submit("b");
  submit("c");
  queue.back("a", "j2");
  queue.back("a", "j3");

  assert.deepEqual(ids(), ["j1", "j2", "j3"]);
});

test("a peer cannot back their own job, and unknown ids are ignored", () => {
  const { submit, queue, emitted } = setup();

  submit("a");
  submit("b");
  const before = emitted.length;

  assert.equal(queue.back("b", "j2"), false);
  assert.equal(queue.back("a", "nope"), false);
  assert.equal(queue.back("a", undefined), false);

  assert.deepEqual(queue.items()[1].backers, []);
  assert.equal(emitted.length, before, "ignored requests are not changes");
});

test("backing toggles", () => {
  const { submit, queue } = setup();

  submit("a");
  submit("b");

  queue.back("a", "j2");
  assert.deepEqual(queue.items()[1].backers, ["a"]);

  queue.back("c", "j2");
  assert.deepEqual(queue.items()[1].backers, ["a", "c"]);

  queue.back("a", "j2");
  assert.deepEqual(queue.items()[1].backers, ["c"]);
});

test("a peer may hold jobsPerPeer jobs, counting the running one", () => {
  const { submit } = setup({ queueMax: 12, jobsPerPeer: 2 });

  submit("a");
  submit("a");
  assert.throws(() => submit("a"), { message: "too_many_jobs" });
  // Someone else is unaffected.
  assert.doesNotThrow(() => submit("b"));
});

test("the queue holds queueMax jobs, counting the running one", () => {
  const { submit } = setup({ queueMax: 3, jobsPerPeer: 5 });

  submit("a");
  submit("b");
  submit("c");
  assert.throws(() => submit("d"), { message: "queue_full" });
});

test("a rejected submit changes nothing and says nothing", () => {
  const { submit, ids, emitted } = setup({ queueMax: 1, jobsPerPeer: 5 });

  submit("a");
  const before = emitted.length;
  assert.throws(() => submit("b"), { message: "queue_full" });

  assert.deepEqual(ids(), ["j1"]);
  assert.equal(emitted.length, before);
});

test("finishing a job frees its slot for the owner's next submit", () => {
  const { submit, queue } = setup({ queueMax: 12, jobsPerPeer: 1 });

  submit("a");
  assert.throws(() => submit("a"), { message: "too_many_jobs" });

  queue.finished("j1");
  assert.doesNotThrow(() => submit("a"));
});

test("only the owner can cancel a queued job", () => {
  const { submit, queue, ids } = setup();

  submit("a");
  submit("b");

  assert.equal(queue.cancel("c", "j2"), false);
  assert.deepEqual(ids(), ["j1", "j2"]);

  assert.equal(queue.cancel("b", "j2"), true);
  assert.deepEqual(ids(), ["j1"]);
  assert.equal(queue.cancel("b", "j2"), false, "already gone");
});

test("cancelling the running job stops its run; the queue moves on when it ends", async () => {
  const { submit, queue, ids, stopped, started } = setup();

  submit("a");
  submit("b");
  await settle();

  assert.equal(queue.cancel("b", "j1"), false, "not theirs");
  assert.deepEqual(stopped, []);

  assert.equal(queue.cancel("a", "j1"), true);
  assert.deepEqual(stopped, ["run_j1"]);
  // Stopping only asks: the job stays until the orchestrator reports the end.
  assert.deepEqual(ids(), ["j1", "j2"]);

  queue.finished("j1");
  await settle();
  assert.deepEqual(started, ["j1", "j2"]);
  assert.deepEqual(ids(), ["j2"]);
});

test("stopCurrent stops only for the owner", async () => {
  const { submit, queue, stopped } = setup();

  assert.equal(queue.stopCurrent("a"), false, "nothing to stop");

  submit("a");
  await settle();

  assert.throws(() => queue.stopCurrent("b"), { message: "not_your_run" });
  assert.deepEqual(stopped, []);

  assert.equal(queue.stopCurrent("a"), true);
  assert.deepEqual(stopped, ["run_j1"]);
});

test("a stop that beats start() is applied once the run exists", async () => {
  const { submit, queue, stopped } = setup();

  submit("a");
  assert.equal(queue.stopCurrent("a"), true);
  assert.deepEqual(stopped, [], "no run to abort yet");

  await settle();
  assert.deepEqual(stopped, ["run_j1"]);
});

test("an owner who disconnects loses queued jobs but not the running one", async () => {
  const { submit, queue, ids } = setup({ queueMax: 12, jobsPerPeer: 3 });

  submit("a"); // running
  submit("a");
  submit("b");
  submit("a");
  await settle();

  assert.equal(queue.dropOwner("a"), true);
  assert.deepEqual(ids(), ["j1", "j3"]);
  assert.equal(queue.items()[0].ownerId, "a");

  assert.equal(queue.dropOwner("a"), false, "nothing left to drop");
});

test("finishing a run starts the next job by itself, most backed first", async () => {
  const { submit, queue, ids, started } = setup({ queueMax: 12, jobsPerPeer: 3 });

  submit("a"); // j1 runs
  submit("b"); // j2
  submit("c"); // j3
  queue.back("a", "j3");
  await settle();

  queue.finished("j1");
  await settle();
  assert.deepEqual(started, ["j1", "j3"]);
  assert.deepEqual(ids(), ["j3", "j2"]);
  assert.equal(queue.items()[0].status, "running");
  assert.equal(queue.items()[0].runId, "run_j3");

  queue.finished("j3");
  await settle();
  assert.deepEqual(started, ["j1", "j3", "j2"]);

  queue.finished("j2");
  await settle();
  assert.deepEqual(ids(), []);

  // Idle again: a new job starts straight away.
  submit("d");
  await settle();
  assert.deepEqual(started, ["j1", "j3", "j2", "j4"]);
});

test("a stale or repeated finished() is ignored", async () => {
  const { submit, queue, started, emitted } = setup();

  submit("a");
  submit("b");
  await settle();

  queue.finished("j2");
  queue.finished("nope");
  assert.deepEqual(started, ["j1"]);

  queue.finished("j1");
  const before = emitted.length;
  queue.finished("j1");
  assert.equal(emitted.length, before);
  assert.deepEqual(started, ["j1", "j2"]);
});

test("every change is broadcast as the whole ordered list", async () => {
  const { submit, queue, emitted } = setup();

  submit("a"); //                    running, runId still null
  await settle(); //                 runId arrives
  submit("b"); //                    queued
  queue.back("a", "j2"); //          backed
  queue.finished("j1"); //           j2 takes over
  await settle(); //                 its runId arrives
  queue.dropOwner("b"); //           the running one stays: nothing changes

  const summary = emitted.map((items) =>
    items.map((job) => `${job.id}:${job.status}:${job.runId ?? "-"}:${job.backers.length}`).join(" ")
  );
  assert.deepEqual(summary, [
    "j1:running:-:0",
    "j1:running:run_j1:0",
    "j1:running:run_j1:0 j2:queued:-:0",
    "j1:running:run_j1:0 j2:queued:-:1",
    "j2:running:-:1",
    "j2:running:run_j2:1"
  ]);
});

test("a job that fails to start is dropped and the next one runs", async () => {
  let calls = 0;
  const started = [];
  const queue = createQueue({
    limits: { queueMax: 12, jobsPerPeer: 5 },
    newId: () => `j${(calls += 1)}`,
    start: async (job) => {
      if (job.id === "j1") throw new Error("provider_down");
      started.push(job.id);
      return { id: `run_${job.id}` };
    },
    stop: () => {},
    emit: () => {}
  });

  const first = queue.submit({ goal: "one", ownerId: "a", ownerName: "A" });
  queue.submit({ goal: "two", ownerId: "b", ownerName: "B" });

  await assert.rejects(first.started, { message: "provider_down" });
  await settle();

  assert.deepEqual(started, ["j2"]);
  assert.deepEqual(queue.items().map((job) => job.id), ["j2"]);
});

test("drain forgets waiting jobs without touching the running one", async () => {
  const { submit, queue, ids } = setup({ queueMax: 12, jobsPerPeer: 5 });

  submit("a");
  submit("b");
  submit("c");
  await settle();

  queue.drain();
  assert.deepEqual(ids(), ["j1"]);

  queue.finished("j1");
  assert.deepEqual(ids(), []);
});

test("items() hands out copies, so callers cannot edit the queue", () => {
  const { submit, queue } = setup();

  submit("a");
  submit("b");

  const [running, waiting] = queue.items();
  waiting.backers.push("intruder");
  running.status = "queued";

  assert.deepEqual(queue.items()[1].backers, []);
  assert.equal(queue.items()[0].status, "running");
});

test("a job remembers where its owner set the agent down, as a copy", async () => {
  const { queue } = setup();

  const { job } = queue.submit({ goal: "a page", ownerId: "a", ownerName: "A", at: { x: 1.5, z: -2 } });
  job.at.x = 99;

  assert.deepEqual(queue.items()[0].at, { x: 1.5, z: -2 });
  assert.equal(setup().queue.submit({ goal: "a page", ownerId: "a", ownerName: "A" }).job.at, null);
});

test("leaving takes your backing with you", async () => {
  const { submit, queue } = setup();

  submit("a");
  const { job: wanted } = submit("b");
  submit("c");
  assert.equal(queue.back("c", wanted.id), true);
  assert.deepEqual(queue.items()[1].backers, ["c"]);

  // c leaves: their own job goes, and so does the vote they cast for b.
  assert.equal(queue.dropOwner("c"), true);
  assert.deepEqual(queue.items().find((job) => job.id === wanted.id).backers, []);
});
