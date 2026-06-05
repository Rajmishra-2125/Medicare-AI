import test from "node:test";
import assert from "node:assert";
import { escapeHTML } from "../utils/sanitize.js";

test("User Account Service - escapeHTML Utility Tests", async (t) => {
  await t.test(
    "should escape '<' and '>' characters properly to prevent scripts running",
    () => {
      const input = "<script>alert('xss')</script>";
      const expected = "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;";
      assert.strictEqual(escapeHTML(input), expected);
    }
  );

  await t.test("should escape ampersands properly", () => {
    const input = "Tom & Jerry";
    const expected = "Tom &amp; Jerry";
    assert.strictEqual(escapeHTML(input), expected);
  });

  await t.test("should escape double and single quotes properly", () => {
    const input = `hacked = "true" or 'true'`;
    const expected = "hacked = &quot;true&quot; or &#39;true&#39;";
    assert.strictEqual(escapeHTML(input), expected);
  });

  await t.test("should return non-string values directly", () => {
    assert.strictEqual(escapeHTML(null), null);
    assert.strictEqual(escapeHTML(123), 123);
  });
});
