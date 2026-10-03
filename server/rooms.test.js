import assert from "node:assert/strict";
import test from "node:test";

import { addPeer, emote, removePeer } from "./rooms.js";

const join = (id) => {
  const seen = [];
  addPeer(id, (message) => seen.push(message));
  return seen;
};

const emotes = (seen) => seen.filter((message) => message.type === "presence:emote");

test("a reaction reaches everyone, sender included", () => {
  const a = join("emote_a");
  const b = join("emote_b");

  assert.equal(emote("emote_a", "heart", 10_000), true);

  assert.deepEqual(emotes(a).map((m) => m.data), [{ id: "emote_a", emote: "heart" }]);
  assert.deepEqual(emotes(b).map((m) => m.data), [{ id: "emote_a", emote: "heart" }]);
  removePeer("emote_a");
  removePeer("emote_b");
});

test("only the five known reactions pass; anything else is dropped", () => {
  const a = join("emote_c");

  for (const junk of ["<script>", "", undefined, 7, "HEART", "wave ", "__proto__"]) {
    assert.equal(emote("emote_c", junk, 20_000), false, String(junk));
  }
  assert.equal(emotes(a).length, 0);
  assert.equal(emote("emote_c", "wave", 20_000), true);
  removePeer("emote_c");
});

test("reactions are rate limited per person, not globally", () => {
  const a = join("emote_d");
  join("emote_e");

  assert.equal(emote("emote_d", "fire", 30_000), true);
  assert.equal(emote("emote_d", "fire", 30_100), false, "too soon");
  assert.equal(emote("emote_e", "fire", 30_100), true, "someone else is unaffected");
  assert.equal(emote("emote_d", "clap", 30_500), true, "after the gap");
  assert.equal(emotes(a).length, 3);
  removePeer("emote_d");
  removePeer("emote_e");
});

test("someone who left cannot react", () => {
  join("emote_f");
  removePeer("emote_f");
  assert.equal(emote("emote_f", "wave", 40_000), false);
});
