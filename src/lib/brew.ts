export type BrewRatio = 14 | 15 | 16;
export type PourCount = 4 | 5 | 6;
export type RoastLevel = "light" | "medium" | "dark";
export type ViewMode = "settings" | "timer";
export type TimerStatus = "idle" | "running" | "paused" | "completed";

export type RecipeSettings = {
  beansGram: number;
  ratio: BrewRatio;
  pourCount: PourCount;
  roastLevel: RoastLevel;
};

export type BrewStep = {
  id: string;
  label: string;
  type: "pour" | "removeDripper";
  startSeconds: number;
  waterGram?: number;
  cumulativeWaterGram?: number;
};

export type BrewSchedule = {
  totalWaterGram: number;
  temperatureLabel: string;
  steps: BrewStep[];
  finishSeconds: number;
};

export type PourMarker = {
  id: string;
  label: string;
  progress: number;
  angleDegrees: number;
};

export const recipeStorageKey = "coffee46Timer.recipe.v1";

export const defaultRecipeSettings: RecipeSettings = {
  beansGram: 20,
  ratio: 15,
  pourCount: 5,
  roastLevel: "medium",
};

const pourRatios: Record<PourCount, number[]> = {
  4: [0.25, 0.25, 0.25, 0.25],
  5: [0.2, 0.2, 0.2, 0.2, 0.2],
  6: [0.167, 0.167, 0.167, 0.167, 0.166, 0.166],
};

const pourStartTimes: Record<PourCount, number[]> = {
  4: [0, 50, 100, 150],
  5: [0, 45, 90, 135, 180],
  6: [0, 40, 80, 120, 160, 200],
};

const temperatureLabels: Record<RoastLevel, string> = {
  light: "92-94C",
  medium: "88-92C",
  dark: "84-88C",
};

export function buildBrewSchedule(settings: RecipeSettings): BrewSchedule {
  const totalWaterGram = Math.round(settings.beansGram * settings.ratio);
  const amounts = calculatePourAmounts(totalWaterGram, settings.pourCount);
  const startTimes = pourStartTimes[settings.pourCount];
  const intervalSeconds = startTimes[1] - startTimes[0];
  const removeDripperTime = startTimes[startTimes.length - 1] + intervalSeconds;
  let cumulativeWaterGram = 0;

  const pourSteps: BrewStep[] = startTimes.map((startSeconds, index) => {
    const waterGram = amounts[index];
    cumulativeWaterGram += waterGram;

    return {
      id: `pour-${index + 1}`,
      label: `Pour ${index + 1}`,
      type: "pour",
      startSeconds,
      waterGram,
      cumulativeWaterGram,
    };
  });

  const steps: BrewStep[] = [
    ...pourSteps,
    {
      id: "remove-dripper",
      label: "Drawdown",
      type: "removeDripper",
      startSeconds: removeDripperTime,
    },
  ];

  return {
    totalWaterGram,
    temperatureLabel: temperatureLabels[settings.roastLevel],
    steps,
    finishSeconds: removeDripperTime,
  };
}

export function calculatePourAmounts(
  totalWaterGram: number,
  pourCount: PourCount,
): number[] {
  const ratios = pourRatios[pourCount];
  const rounded = ratios.map((ratio) => Math.round(totalWaterGram * ratio));
  const beforeLast = rounded
    .slice(0, -1)
    .reduce((sum, amount) => sum + amount, 0);

  return [...rounded.slice(0, -1), totalWaterGram - beforeLast];
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getActiveStepIndex(
  steps: BrewStep[],
  elapsedSeconds: number,
): number {
  return steps.reduce((activeIndex, step, index) => {
    return elapsedSeconds >= step.startSeconds ? index : activeIndex;
  }, 0);
}

export function getTimerProgress(
  elapsedSeconds: number,
  finishSeconds: number,
): number {
  if (finishSeconds <= 0) {
    return 100;
  }

  const progress = Math.round((elapsedSeconds / finishSeconds) * 100);
  return Math.min(100, Math.max(0, progress));
}

export function getActiveTargetWaterGram(
  activeStep: BrewStep,
  totalWaterGram: number,
): number {
  return activeStep.cumulativeWaterGram ?? totalWaterGram;
}

export function getPourMarkers(
  steps: BrewStep[],
  finishSeconds: number,
): PourMarker[] {
  return steps
    .filter((step) => step.type === "pour")
    .map((step, index) => ({
      id: step.id,
      label: String(index + 1),
      progress: getTimerProgress(step.startSeconds, finishSeconds),
      angleDegrees: getTimerProgress(step.startSeconds, finishSeconds) * 3.6,
    }));
}

export function readRecipeSettings(rawValue: string | null): RecipeSettings {
  if (!rawValue) {
    return defaultRecipeSettings;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<RecipeSettings>;

    if (
      typeof parsed.beansGram !== "number" ||
      parsed.beansGram <= 0 ||
      !isBrewRatio(parsed.ratio) ||
      !isPourCount(parsed.pourCount) ||
      !isRoastLevel(parsed.roastLevel)
    ) {
      return defaultRecipeSettings;
    }

    return {
      beansGram: parsed.beansGram,
      ratio: parsed.ratio,
      pourCount: parsed.pourCount,
      roastLevel: parsed.roastLevel,
    };
  } catch {
    return defaultRecipeSettings;
  }
}

export function serializeRecipeSettings(settings: RecipeSettings): string {
  return JSON.stringify(settings);
}

function isBrewRatio(value: unknown): value is BrewRatio {
  return value === 14 || value === 15 || value === 16;
}

function isPourCount(value: unknown): value is PourCount {
  return value === 4 || value === 5 || value === 6;
}

function isRoastLevel(value: unknown): value is RoastLevel {
  return value === "light" || value === "medium" || value === "dark";
}
