import { Check, Coins, Gem, Sparkles, Target, X } from "lucide-react";
import type { Quest } from "./shared";

interface Props {
  open: boolean;
  quests: Quest[];
  onClose: () => void;
  onClaim: (quest: Quest) => void;
}

export const QuestBoardModal = ({ open, quests, onClose, onClaim }: Props) => {
  if (!open) return null;
  const claimed = quests.filter((quest) => quest.claimed).length;

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal quest-modal" role="dialog" aria-modal="true" aria-labelledby="quest-title">
        <header className="modal__head">
          <div><small>VILLAGE QUESTS</small><h2 id="quest-title">Small steps, living products</h2><p>Complete real product work to unlock rewards for the village.</p></div>
          <button type="button" className="icon" onClick={onClose} aria-label="Close quest board"><X size={17} /></button>
        </header>
        <div className="quest-progress"><span><Target size={13} /> {claimed}/{quests.length} claimed</span><i><b style={{ width: `${quests.length ? (claimed / quests.length) * 100 : 0}%` }} /></i></div>
        <div className="quest-list">
          {quests.map((quest) => <article className={`quest-row ${quest.claimed ? "quest-row--claimed" : quest.completed ? "quest-row--ready" : ""}`} key={quest.id}>
            <span className="quest-row__icon">{quest.claimed ? <Check size={15} /> : <Sparkles size={15} />}</span>
            <div className="quest-row__copy"><strong>{quest.title}</strong><small>{quest.description}</small><span className="quest-row__reward"><span><Coins size={11} /> +{quest.coins}</span>{quest.gems > 0 && <span><Gem size={11} /> +{quest.gems}</span>}<span>+{quest.xp} XP</span></span></div>
            <button type="button" className={quest.completed && !quest.claimed ? "primary" : "secondary"} disabled={!quest.completed || quest.claimed} onClick={() => onClaim(quest)}>{quest.claimed ? "Claimed" : quest.completed ? "Claim" : "In progress"}</button>
          </article>)}
        </div>
      </section>
    </div>
  );
};
