import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useUserStore } from "../../stores/userStore";
import "./OnboardingWizard.css";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [detectedCLIs, setDetectedCLIs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { setDetectedCLIs: storeDetectedCLIs } = useUserStore();

  useEffect(() => {
    const detectCLIs = async () => {
      try {
        const clis = await invoke("detect_installed_clis");
        setDetectedCLIs(clis as string[]);
        storeDetectedCLIs(clis as string[]);
      } catch (error) {
        console.error("Failed to detect CLIs:", error);
      } finally {
        setLoading(false);
      }
    };

    detectCLIs();
  }, []);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    setStep(3);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {step === 0 && (
          <div className="onboarding-step">
            <div className="onboarding-icon">🛸</div>
            <h1>Welcome to SwarmVille</h1>
            <p>
              Collaborate with AI agents in interactive 2D spaces using your
              existing AI subscriptions.
            </p>
            <button onClick={handleNext} className="btn btn-primary">
              Get Started
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step">
            <h2>Detect Your AI CLIs</h2>
            {loading ? (
              <div className="spinner" />
            ) : (
              <div className="cli-list">
                {detectedCLIs.length > 0 ? (
                  <>
                    <p className="success">Found {detectedCLIs.length} CLI(s):</p>
                    {detectedCLIs.map((cli) => (
                      <div key={cli} className="cli-item">
                        ✓ {cli}
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="warning">
                    No AI CLIs detected. You can configure them manually later.
                  </p>
                )}
              </div>
            )}
            <div className="button-group">
              <button onClick={handleSkip} className="btn btn-secondary">
                Skip
              </button>
              <button onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h2>Configure Settings</h2>
            <div className="setting-group">
              <label>Speech-to-Text Hotkey</label>
              <input
                type="text"
                defaultValue="Ctrl+Space"
                className="input"
              />
            </div>
            <div className="setting-group">
              <label>Whisper Model Size</label>
              <select className="input">
                <option>Small (fast)</option>
                <option>Medium (balanced)</option>
                <option>Large (accurate)</option>
              </select>
            </div>
            <div className="button-group">
              <button onClick={handleSkip} className="btn btn-secondary">
                Skip
              </button>
              <button onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <div className="onboarding-icon">✨</div>
            <h2>You're All Set!</h2>
            <p>Create your first space and start collaborating with AI agents.</p>
            <button onClick={onComplete} className="btn btn-primary">
              Create First Space
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
