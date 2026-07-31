import assert from "node:assert/strict";
import {
  buildPaceTable,
  calculateCriticalSwimSpeed,
  calculateSendoff,
  calculateSetMath,
  calculateStrokeMetrics,
  convertDistance,
  formatSwimTime,
  parseSwimTime,
  planSplits,
} from "../src/swimMath";

assert.equal(parseSwimTime("1:02.5"), 62.5);
assert.equal(formatSwimTime(62.5), "1:02.5");
assert.equal(formatSwimTime(59.96), "1:00.0");
assert.equal(buildPaceTable(500, 450, [100])[0].seconds, 90);

const splits = planSplits(200, 120, 50, "negative");
assert.ok(Math.abs(splits.reduce((sum, split) => sum + split.splitSeconds, 0) - 120) < 1e-8);

const sendoff = calculateSendoff(75, 100, 12, 5);
assert.equal(sendoff.sendoffSeconds, 90);
assert.equal(sendoff.expectedRestSeconds, 15);

const css = calculateCriticalSwimSpeed(200, 130, 400, 280);
assert.ok(css);
assert.ok(Math.abs(css.speed - 4 / 3) < 1e-8);

const stroke = calculateStrokeMetrics(50, 30, 18);
assert.ok(stroke);
assert.equal(stroke.strokeRate, 36);

const set = calculateSetMath({ reps: 8, distance: 100, rounds: 2, timingMode: "sendoff", sendoffSeconds: 90, pacePer100Seconds: 75, restSeconds: 0 });
assert.equal(set.totalDistance, 1600);
assert.equal(set.totalSeconds, 1440);
assert.ok(Math.abs(convertDistance(100, "m-to-yd") - 109.3613298) < 0.0001);

console.log("✓ pace parsing and formatting");
console.log("✓ exact split totals and send-off rounding");
console.log("✓ critical speed and stroke metrics");
console.log("✓ set duration and distance conversion");
