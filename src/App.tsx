import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildBrewSchedule,
  formatTime,
  getActiveStepIndex,
  readRecipeSettings,
  recipeStorageKey,
  serializeRecipeSettings,
  type BrewRatio,
  type PourCount,
  type RecipeSettings,
  type RoastLevel,
  type TimerStatus,
  type ViewMode,
} from "./lib/brew";

const ratioOptions: BrewRatio[] = [14, 15, 16];
const pourCountOptions: PourCount[] = [4, 5, 6];
const roastOptions: Array<{ value: RoastLevel; label: string }> = [
  { value: "light", label: "浅煎り" },
  { value: "medium", label: "中煎り" },
  { value: "dark", label: "深煎り" },
];

export default function App() {
  const [settings, setSettings] = useState<RecipeSettings>(() =>
    readRecipeSettings(window.localStorage.getItem(recipeStorageKey)),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("settings");
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const pausedSecondsRef = useRef(0);

  const schedule = useMemo(() => buildBrewSchedule(settings), [settings]);
  const activeStepIndex = getActiveStepIndex(schedule.steps, elapsedSeconds);
  const activeStep = schedule.steps[activeStepIndex];
  const nextPour = schedule.steps
    .slice(activeStepIndex)
    .find((step) => step.type === "pour" && step.startSeconds >= elapsedSeconds);

  useEffect(() => {
    window.localStorage.setItem(
      recipeStorageKey,
      serializeRecipeSettings(settings),
    );
  }, [settings]);

  useEffect(() => {
    if (timerStatus !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (startedAtRef.current === null) {
        return;
      }

      const nextElapsed = Math.floor(
        (Date.now() - startedAtRef.current) / 1000 + pausedSecondsRef.current,
      );

      if (nextElapsed >= schedule.finishSeconds) {
        setElapsedSeconds(schedule.finishSeconds);
        setTimerStatus("completed");
        startedAtRef.current = null;
        pausedSecondsRef.current = 0;
        return;
      }

      setElapsedSeconds(nextElapsed);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [schedule.finishSeconds, timerStatus]);

  function updateSettings(nextSettings: RecipeSettings) {
    setSettings(nextSettings);
    resetTimer();
  }

  function startTimer() {
    startedAtRef.current = Date.now();
    pausedSecondsRef.current = elapsedSeconds;
    setTimerStatus("running");
    setViewMode("timer");
  }

  function pauseTimer() {
    pausedSecondsRef.current = elapsedSeconds;
    startedAtRef.current = null;
    setTimerStatus("paused");
  }

  function resetTimer() {
    startedAtRef.current = null;
    pausedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setTimerStatus("idle");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">46 Method</p>
          <h1>抽出タイマー</h1>
        </div>
        <div className="view-switch" aria-label="画面切り替え">
          <button
            className={viewMode === "settings" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("settings")}
          >
            設定
          </button>
          <button
            className={viewMode === "timer" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("timer")}
          >
            タイマー
          </button>
        </div>
      </header>

      {viewMode === "settings" ? (
        <SettingsScreen
          settings={settings}
          onChange={updateSettings}
          onStart={startTimer}
        />
      ) : (
        <TimerScreen
          activeStepId={activeStep.id}
          activeStepLabel={activeStep.label}
          elapsedSeconds={elapsedSeconds}
          nextPourGram={nextPour?.waterGram}
          onPause={pauseTimer}
          onReset={resetTimer}
          onStart={startTimer}
          schedule={schedule}
          status={timerStatus}
        />
      )}
    </main>
  );
}

type SettingsScreenProps = {
  settings: RecipeSettings;
  onChange: (settings: RecipeSettings) => void;
  onStart: () => void;
};

function SettingsScreen({ settings, onChange, onStart }: SettingsScreenProps) {
  const schedule = buildBrewSchedule(settings);

  return (
    <section className="screen">
      <RecipeForm settings={settings} onChange={onChange} />
      <section className="summary-grid" aria-label="抽出サマリー">
        <div className="metric">
          <span>総湯量</span>
          <strong>{schedule.totalWaterGram}g</strong>
        </div>
        <div className="metric">
          <span>温度目安</span>
          <strong>{schedule.temperatureLabel}</strong>
        </div>
      </section>
      <SchedulePreview
        activeStepId={schedule.steps[0].id}
        steps={schedule.steps}
      />
      <button className="primary-action" type="button" onClick={onStart}>
        タイマーを開始
      </button>
    </section>
  );
}

type RecipeFormProps = {
  settings: RecipeSettings;
  onChange: (settings: RecipeSettings) => void;
};

function RecipeForm({ settings, onChange }: RecipeFormProps) {
  return (
    <form className="recipe-form">
      <label className="field">
        <span>豆量</span>
        <div className="number-input">
          <input
            min={1}
            step={1}
            type="number"
            value={settings.beansGram}
            onChange={(event) =>
              onChange({
                ...settings,
                beansGram: Math.max(1, Number(event.target.value) || 1),
              })
            }
          />
          <span>g</span>
        </div>
      </label>

      <SegmentedControl
        label="抽出比率"
        options={ratioOptions.map((ratio) => ({
          value: ratio,
          label: `1:${ratio}`,
        }))}
        value={settings.ratio}
        onChange={(ratio) => onChange({ ...settings, ratio })}
      />

      <SegmentedControl
        label="投数"
        options={pourCountOptions.map((pourCount) => ({
          value: pourCount,
          label: `${pourCount}投`,
        }))}
        value={settings.pourCount}
        onChange={(pourCount) => onChange({ ...settings, pourCount })}
      />

      <SegmentedControl
        label="焙煎度"
        options={roastOptions}
        value={settings.roastLevel}
        onChange={(roastLevel) => onChange({ ...settings, roastLevel })}
      />
    </form>
  );
}

type SegmentedControlProps<T extends string | number> = {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
};

function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="field segmented-field">
      <legend>{label}</legend>
      <div className="segments">
        {options.map((option) => (
          <button
            className={option.value === value ? "selected" : ""}
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

type TimerScreenProps = {
  activeStepId: string;
  activeStepLabel: string;
  elapsedSeconds: number;
  nextPourGram?: number;
  onPause: () => void;
  onReset: () => void;
  onStart: () => void;
  schedule: ReturnType<typeof buildBrewSchedule>;
  status: TimerStatus;
};

function TimerScreen({
  activeStepId,
  activeStepLabel,
  elapsedSeconds,
  nextPourGram,
  onPause,
  onReset,
  onStart,
  schedule,
  status,
}: TimerScreenProps) {
  return (
    <section className="screen timer-screen">
      <section className="timer-hero" aria-live="polite">
        <span className="timer-label">
          {status === "completed" ? "抽出完了" : activeStepLabel}
        </span>
        <strong>{formatTime(elapsedSeconds)}</strong>
        <p>
          {status === "completed"
            ? "おつかれさまでした"
            : nextPourGram
              ? `次に注ぐ湯量 ${nextPourGram}g`
              : "ドリッパーを外す"}
        </p>
      </section>

      <div className="timer-controls">
        {status === "running" ? (
          <button type="button" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button type="button" onClick={onStart}>
            Start
          </button>
        )}
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>

      <SchedulePreview activeStepId={activeStepId} steps={schedule.steps} />
    </section>
  );
}

type SchedulePreviewProps = {
  activeStepId: string;
  steps: ReturnType<typeof buildBrewSchedule>["steps"];
};

function SchedulePreview({ activeStepId, steps }: SchedulePreviewProps) {
  return (
    <section className="step-list" aria-label="抽出スケジュール">
      {steps.map((step) => (
        <article
          className={step.id === activeStepId ? "step active-step" : "step"}
          key={step.id}
        >
          <div>
            <span>{formatTime(step.startSeconds)}</span>
            <strong>{step.label}</strong>
          </div>
          {step.type === "pour" ? (
            <p>
              {step.waterGram}g
              <small>累計 {step.cumulativeWaterGram}g</small>
            </p>
          ) : (
            <p>Finish</p>
          )}
        </article>
      ))}
    </section>
  );
}
