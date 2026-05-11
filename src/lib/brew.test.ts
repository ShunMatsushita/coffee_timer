import { describe, expect, it } from "vitest";
import {
  buildBrewSchedule,
  defaultRecipeSettings,
  formatTime,
  getActiveStepIndex,
  getPourMarkers,
  getTimerProgress,
  readRecipeSettings,
} from "./brew";

describe("buildBrewSchedule", () => {
  it("builds the default 5-pour schedule", () => {
    const schedule = buildBrewSchedule(defaultRecipeSettings);

    expect(schedule.totalWaterGram).toBe(300);
    expect(schedule.temperatureLabel).toBe("88〜92℃");
    expect(schedule.steps.map((step) => step.startSeconds)).toEqual([
      0, 45, 90, 135, 180, 225,
    ]);
    expect(schedule.steps.map((step) => step.waterGram)).toEqual([
      60,
      60,
      60,
      60,
      60,
      undefined,
    ]);
    expect(schedule.steps.at(-1)?.label).toBe("ドリッパーを外す");
  });

  it("adjusts the final pour so rounded amounts equal total water", () => {
    const schedule = buildBrewSchedule({
      beansGram: 17,
      ratio: 15,
      pourCount: 6,
      roastLevel: "light",
    });

    const pourTotal = schedule.steps.reduce(
      (sum, step) => sum + (step.waterGram ?? 0),
      0,
    );

    expect(schedule.totalWaterGram).toBe(255);
    expect(pourTotal).toBe(255);
    expect(schedule.temperatureLabel).toBe("92〜94℃");
  });

  it("uses the 4-pour timings and dark roast temperature", () => {
    const schedule = buildBrewSchedule({
      beansGram: 20,
      ratio: 14,
      pourCount: 4,
      roastLevel: "dark",
    });

    expect(schedule.totalWaterGram).toBe(280);
    expect(schedule.steps.map((step) => step.startSeconds)).toEqual([
      0, 50, 100, 150, 200,
    ]);
    expect(schedule.temperatureLabel).toBe("84〜88℃");
  });
});

describe("formatTime", () => {
  it("formats seconds as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(45)).toBe("0:45");
    expect(formatTime(125)).toBe("2:05");
  });
});

describe("getActiveStepIndex", () => {
  it("returns the latest started step", () => {
    const schedule = buildBrewSchedule(defaultRecipeSettings);

    expect(getActiveStepIndex(schedule.steps, 0)).toBe(0);
    expect(getActiveStepIndex(schedule.steps, 89)).toBe(1);
    expect(getActiveStepIndex(schedule.steps, 225)).toBe(5);
  });
});

describe("getTimerProgress", () => {
  it("returns a clamped progress percentage", () => {
    expect(getTimerProgress(-10, 225)).toBe(0);
    expect(getTimerProgress(0, 225)).toBe(0);
    expect(getTimerProgress(112, 225)).toBe(50);
    expect(getTimerProgress(225, 225)).toBe(100);
    expect(getTimerProgress(300, 225)).toBe(100);
  });

  it("returns 100 when finish time is zero", () => {
    expect(getTimerProgress(10, 0)).toBe(100);
  });
});

describe("getPourMarkers", () => {
  it("returns pour steps as clamped progress markers", () => {
    const schedule = buildBrewSchedule(defaultRecipeSettings);

    expect(getPourMarkers(schedule.steps, schedule.finishSeconds)).toEqual([
      { id: "pour-1", label: "1", progress: 0 },
      { id: "pour-2", label: "2", progress: 20 },
      { id: "pour-3", label: "3", progress: 40 },
      { id: "pour-4", label: "4", progress: 60 },
      { id: "pour-5", label: "5", progress: 80 },
    ]);
  });
});

describe("readRecipeSettings", () => {
  it("falls back to defaults when stored data is invalid", () => {
    expect(readRecipeSettings("{bad json")).toEqual(defaultRecipeSettings);
    expect(readRecipeSettings('{"beansGram":0}')).toEqual(defaultRecipeSettings);
  });

  it("reads valid persisted settings", () => {
    expect(
      readRecipeSettings(
        JSON.stringify({
          beansGram: 22,
          ratio: 14,
          pourCount: 4,
          roastLevel: "dark",
        }),
      ),
    ).toEqual({
      beansGram: 22,
      ratio: 14,
      pourCount: 4,
      roastLevel: "dark",
    });
  });

  it("rejects the removed 1:17 ratio", () => {
    expect(
      readRecipeSettings(
        JSON.stringify({
          beansGram: 22,
          ratio: 17,
          pourCount: 4,
          roastLevel: "dark",
        }),
      ),
    ).toEqual(defaultRecipeSettings);
  });
});
