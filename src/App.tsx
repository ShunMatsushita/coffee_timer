import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  buildBrewSchedule,
  formatTime,
  getActiveStepIndex,
  getActiveTargetWaterGram,
  getPourMarkers,
  getTimerProgress,
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
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "dark", label: "Dark" },
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
  const progress = getTimerProgress(elapsedSeconds, schedule.finishSeconds);
  const pourMarkers = getPourMarkers(schedule.steps, schedule.finishSeconds);
  const targetWaterGram = getActiveTargetWaterGram(
    activeStep,
    schedule.totalWaterGram,
  );

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
          <h1>46 Brew Timer</h1>
        </div>
        <div className="view-switch" aria-label="View switcher">
          <button
            className={viewMode === "settings" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("settings")}
          >
            Setup
          </button>
          <button
            className={viewMode === "timer" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("timer")}
          >
            Timer
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
          activeStepLabel={
            statusLabel(timerStatus, activeStep.label)
          }
          currentPourGram={activeStep.waterGram}
          elapsedSeconds={elapsedSeconds}
          onPause={pauseTimer}
          onReset={resetTimer}
          onStart={startTimer}
          pourMarkers={pourMarkers}
          progress={progress}
          schedule={schedule}
          status={timerStatus}
          targetWaterGram={targetWaterGram}
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
    <section className="screen setup-screen">
      <RecipeForm settings={settings} onChange={onChange} />
      <section className="summary-grid" aria-label="Brew summary">
        <div className="metric">
          <span>Total Water</span>
          <strong>{schedule.totalWaterGram}g</strong>
        </div>
        <div className="metric">
          <span>Target Temp</span>
          <strong>{schedule.temperatureLabel}</strong>
        </div>
      </section>
      <SchedulePreview
        activeStepId={schedule.steps[0].id}
        steps={schedule.steps}
      />
      <button className="primary-action" type="button" onClick={onStart}>
        Start Timer
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
      <label className="field beans-field">
        <span>Beans</span>
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
        label="Ratio"
        options={ratioOptions.map((ratio) => ({
          value: ratio,
          label: `1:${ratio}`,
        }))}
        value={settings.ratio}
        onChange={(ratio) => onChange({ ...settings, ratio })}
      />

      <SegmentedControl
        label="Pours"
        options={pourCountOptions.map((pourCount) => ({
          value: pourCount,
          label: String(pourCount),
        }))}
        value={settings.pourCount}
        onChange={(pourCount) => onChange({ ...settings, pourCount })}
      />

      <SegmentedControl
        label="Roast"
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
  currentPourGram?: number;
  elapsedSeconds: number;
  onPause: () => void;
  onReset: () => void;
  onStart: () => void;
  pourMarkers: ReturnType<typeof getPourMarkers>;
  progress: number;
  schedule: ReturnType<typeof buildBrewSchedule>;
  status: TimerStatus;
  targetWaterGram: number;
};

function TimerScreen({
  activeStepId,
  activeStepLabel,
  currentPourGram,
  elapsedSeconds,
  onPause,
  onReset,
  onStart,
  pourMarkers,
  progress,
  schedule,
  status,
  targetWaterGram,
}: TimerScreenProps) {
  const ringStyle = {
    "--progress": `${progress}%`,
  } as CSSProperties;

  return (
    <section className="screen timer-screen">
      <section className="timer-dashboard" aria-live="polite">
        <div
          className={status === "completed" ? "timer-ring complete" : "timer-ring"}
          style={ringStyle}
        >
          <div className="pour-markers" aria-hidden="true">
            {pourMarkers.map((marker) => (
              <span
                className={
                  marker.id === activeStepId
                    ? "pour-marker active-marker"
                    : "pour-marker"
                }
                key={marker.id}
                style={
                  {
                    "--marker-angle": `${marker.angleDegrees}deg`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="timer-ring-core">
            <span className="timer-label">{activeStepLabel}</span>
            <strong>{formatTime(elapsedSeconds)}</strong>
            <div className="target-pill">
              <span>Target</span>
              <b>{targetWaterGram}g</b>
            </div>
          </div>
        </div>

        <div className="water-target-panel">
          <span>Target Water</span>
          <strong className="water-target-value">{targetWaterGram}g</strong>
          <p>Aim for this total by the end of the current pour.</p>
        </div>

        <div className="timer-meta-grid">
          <StatCard label="Current Pour" value={currentPourGram ? `${currentPourGram}g` : "Done"} />
          <StatCard label="Total Water" value={`${schedule.totalWaterGram}g`} emphasized />
          <StatCard label="Finish" value={formatTime(schedule.finishSeconds)} />
        </div>
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

type StatCardProps = {
  label: string;
  value: string;
  emphasized?: boolean;
};

function StatCard({ label, value, emphasized = false }: StatCardProps) {
  return (
    <div className={emphasized ? "stat-card emphasized-stat" : "stat-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type SchedulePreviewProps = {
  activeStepId: string;
  steps: ReturnType<typeof buildBrewSchedule>["steps"];
};

function SchedulePreview({ activeStepId, steps }: SchedulePreviewProps) {
  return (
    <section className="step-list" aria-label="Brew schedule">
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
              <small>Target {step.cumulativeWaterGram}g</small>
            </p>
          ) : (
            <p>Done</p>
          )}
        </article>
      ))}
    </section>
  );
}

function statusLabel(status: TimerStatus, stepLabel: string): string {
  if (status === "completed") {
    return "Complete";
  }

  return stepLabel;
}
