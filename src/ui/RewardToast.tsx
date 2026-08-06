import { Coins, Gem, Sparkles } from "lucide-react";

interface Props { message: string | null; title?: string; }

export const RewardToast = ({ message, title = "Village update" }: Props) => {
  if (!message) return null;
  return (
    <div className="reward-toast" role="status" aria-live="polite">
      <span className="reward-toast__icon"><Sparkles size={16} /></span>
      <span className="reward-toast__copy"><strong>{title}</strong><small>{message}</small></span>
      <span className="reward-toast__tokens"><Coins size={12} /><Gem size={12} /></span>
    </div>
  );
};
