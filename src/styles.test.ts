// @ts-nocheck
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(__dirname, "styles.css"), "utf-8");

describe("neumorphism 2.0 styling", () => {
  it("defines soft surface tokens for raised and pressed UI", () => {
    expect(styles).toContain("--surface-base:");
    expect(styles).toContain("--shadow-raised:");
    expect(styles).toContain("--shadow-pressed:");
    expect(styles).toContain("--highlight-edge:");
  });

  it("applies raised surfaces to primary panels and pressed states to selected controls", () => {
    expect(styles).toMatch(/\.timer-dashboard\s*{[^}]*var\(--shadow-raised\)/s);
    expect(styles).toMatch(/\.metric\s*{[^}]*var\(--shadow-raised\)/s);
    expect(styles).toMatch(/\.view-switch \.active,[\s\S]*?box-shadow:\s*var\(--shadow-pressed\)/);
  });

  it("keeps the timer ring legible while adding dimensional shadows", () => {
    expect(styles).toMatch(/\.timer-ring\s*{[^}]*conic-gradient\(#ff8a00 var\(--progress\)/s);
    expect(styles).toMatch(/\.timer-ring\s*{[^}]*var\(--shadow-floating\)/s);
    expect(styles).toMatch(/\.timer-ring-core\s*{[^}]*var\(--shadow-pressed\)/s);
  });
});
