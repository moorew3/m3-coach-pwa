import test from "node:test";
import assert from "node:assert/strict";
import {
  WEEK,
  exercisesForDay,
  groupSupersetPartners,
  orderedExercises,
  planForDay,
} from "../src/data/program.ts";

const ids = (items) => items.map((item) => item.id);

test("all seven days preserve every movement, prescribed sets and rest", () => {
  for (let day = 1; day <= WEEK.length; day++) {
    const source = exercisesForDay(day);
    const grouped = orderedExercises(day, true);
    assert.deepEqual([...ids(grouped)].sort(), [...ids(source)].sort(), `day ${day} inventory`);
    assert.equal(new Set(ids(grouped)).size, grouped.length, `day ${day} duplicate`);
    for (const item of grouped) {
      const prior = source.find((e) => e.id === item.id);
      assert.equal(item.sets, prior.sets, item.id);
      assert.equal(item.reps, prior.reps, item.id);
      assert.equal(item.rest, prior.rest, item.id);
      assert.equal(item.supersetRest, prior.supersetRest, item.id);
    }
  }
});

test("declared partners are consecutive within each workout section", () => {
  for (let day = 1; day <= WEEK.length; day++) {
    const plan = planForDay(day);
    const grouped = orderedExercises(day, true);
    let offset = 0;
    for (const section of [plan.warmup, plan.main, plan.finisher]) {
      const arranged = grouped.slice(offset, offset + section.length);
      offset += section.length;
      assert.deepEqual([...ids(arranged)].sort(), [...ids(section)].sort());
      const labels = new Set(arranged.map((e) => e.superset).filter(Boolean));
      for (const label of labels) {
        const indices = arranged.flatMap((e, i) => e.superset === label ? [i] : []);
        assert.equal(
          indices.at(-1) - indices[0] + 1,
          indices.length,
          `day ${day}, group ${label} should have no interposed standalone sets`,
        );
      }
    }
  }
});

test("Monday's B1 curl passes directly to B2 pressdown before the solo hammer curl", () => {
  const grouped = ids(orderedExercises(1, true));
  const b1 = grouped.indexOf("mon-db-curl");
  const b2 = grouped.indexOf("mon-triceps-pressdown");
  const solo = grouped.indexOf("mon-hammer-curl");
  assert.ok(b1 >= 0 && b2 >= 0 && solo >= 0);
  assert.equal(b2, b1 + 1, "superset partners must be back to back");
  assert.ok(solo > b2, "standalone hammer curls follow the intact pair");
});

test("supersets-off keeps the original exercise order and disables pairing", () => {
  for (let day = 1; day <= WEEK.length; day++) {
    const source = exercisesForDay(day);
    const ordinary = orderedExercises(day, false);
    assert.deepEqual(ids(ordinary), ids(source));
    assert.ok(ordinary.every((e) => !e.superset && !e.supersetSlot));
  }
});

test("helper handles a three-slot group with an interposed solo exercise", () => {
  const A1 = { id: "a1", superset: "A" };
  const solo = { id: "solo" };
  const A2 = { id: "a2", superset: "A" };
  const B1 = { id: "b1", superset: "B" };
  const A3 = { id: "a3", superset: "A" };
  const B2 = { id: "b2", superset: "B" };
  const order = groupSupersetPartners([A1, solo, A2, B1, A3, B2]);
  assert.deepEqual(ids(order), ["a1", "a2", "a3", "solo", "b1", "b2"]);
  assert.equal(order[0], A1, "original exercise object must remain unchanged");
});

test("superset partner handoff is preparation, not an artificial rest timer", async () => {
  const { readFileSync } = await import("node:fs");
  const coach = readFileSync(new URL("../src/lib/coach-script.ts", import.meta.url), "utf8");
  assert.match(coach, /id: \`\$\{e\.id\}-handoff-\$\{r\}\`,\s*\/\/ A superset partner handoff is coaching\/prep, never a rest interval\.\s*kind: "brief"/);
  assert.match(coach, /\/\* inside a pair: no rest/);
  assert.match(coach, /if \(partnerFollows\) return/);
});
