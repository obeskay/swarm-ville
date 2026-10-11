import { useState } from "react";
import { Sprout, Map, MousePointer2, ListChecks, Sparkles, ArrowRight, X } from "lucide-react";

/**
 * CalmGuide — one thing at a time.
 *
 * Instead of five panels arguing for attention, this walks a first-time user
 * through a single question per screen, Typeform-style. Each step is one
 * decision; nothing else is on screen to compete with it. Skippable at any
 * point, and it never appears again once finished.
 */
interface Props {
  hasProjects: boolean;
  onPlant: () => void;
  onExplore: () => void;
  onStart: (goal: string) => void;
  onClose: () => void;
}

type StepId = "welcome" | "plant" | "objective" | "done";

const stepsFor = (hasProjects: boolean): StepId[] =>
  hasProjects ? ["welcome", "objective"] : ["welcome", "plant", "objective"];

export const CalmGuide = ({ hasProjects, onPlant, onExplore, onStart, onClose }: Props) => {
  const [step, setStep] = useState<StepId>("welcome");
  const [goal, setGoal] = useState("");

  const steps = stepsFor(hasProjects);
  const index = Math.max(0, steps.indexOf(step));
  const total = steps.length;
  const canStart = goal.trim().length >= 4;

  return (
    <div className="calm" role="dialog" aria-modal="true" aria-label="Getting started">
      <button type="button" className="calm__skip" onClick={onClose}>
        Skip <X size={13} />
      </button>

      <div className="calm__card" key={step}>
        {step === "welcome" && (
          <>
            <span className="calm__icon"><Sparkles size={20} /></span>
            <h1 className="calm__title">Your five agents need a job.</h1>
            <p className="calm__lede">
              You write one objective. Atlas plans, Neo builds, Socrates reviews it,
              Vanguard verifies, Alexandria files it. Watch it happen on the map.
            </p>
            <button type="button" className="calm__cta" onClick={() => setStep(stepsFor(hasProjects)[1])}>
              {hasProjects ? "Give them a job" : "Start"} <ArrowRight size={15} />
            </button>
          </>
        )}

        {step === "plant" && (
          <>
            <span className="calm__icon"><Sprout size={20} /></span>
            <h1 className="calm__title">Where should it happen?</h1>
            <p className="calm__lede">A plot is just a place to hold the work. Pick one and the village opens up.</p>
            <button type="button" className="calm__cta" onClick={onPlant}>
              <Sprout size={15} /> Plant my first product
            </button>
            <button type="button" className="calm__ghost" onClick={() => setStep("objective")}>
              I already have one
            </button>
          </>
        )}

        {step === "objective" && (
          <>
            <span className="calm__icon"><ListChecks size={20} /></span>
            <h1 className="calm__title">What should they build?</h1>
            <p className="calm__lede">One sentence is enough. Be specific about the outcome you want.</p>
            <form
              className="calm__form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!canStart) return;
                onStart(goal.trim());
                setStep("done");
              }}
            >
              <input
                autoFocus
                value={goal}
                maxLength={600}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="e.g. a landing page for a coffee subscription"
                aria-label="Objective for the swarm"
              />
              <button type="submit" className="calm__cta" disabled={!canStart}>
                Send to the swarm <ArrowRight size={15} />
              </button>
            </form>
            <button type="button" className="calm__ghost" onClick={onExplore}>
              <Map size={14} /> Just look around first
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <span className="calm__icon calm__icon--live"><Sparkles size={20} /></span>
            <h1 className="calm__title">They're on it.</h1>
            <p className="calm__lede">
              The ring around an agent's name lights up while it thinks. You can close
              this and watch, or click any agent to read what it's doing.
            </p>
            <button type="button" className="calm__cta" onClick={onClose}>
              <MousePointer2 size={15} /> Watch the village
            </button>
          </>
        )}
      </div>

      {step !== "done" && (
        <div className="calm__dots" aria-hidden>
          {steps.map((id, i) => (
            <span key={id} className={i <= index ? "is-on" : ""} />
          ))}
          <small>{index + 1} of {total}</small>
        </div>
      )}
    </div>
  );
};
