import { BatteryCharging, Coins, Droplets, MapPinned, Sprout, X, Zap } from "lucide-react";
import type { GameProfile, MarketItemId } from "./shared";

interface Props {
  open: boolean;
  profile: GameProfile;
  onClose: () => void;
  onBuy: (item: MarketItemId) => void;
}

export const MarketModal = ({ open, profile, onClose, onBuy }: Props) => {
  if (!open) return null;
  const energy = profile.energy ?? 0;
  const maxEnergy = profile.maxEnergy ?? 8;
  const items: Array<{
    id: MarketItemId;
    icon: typeof Sprout;
    name: string;
    detail: string;
    price: number;
    owned: string;
    disabled: boolean;
  }> = [
    {
      id: "fertilizer",
      icon: Droplets,
      name: "Sunlit fertilizer",
      detail: "Give one plot a generous +12% growth boost.",
      price: 45,
      owned: `${profile.fertilizer ?? 0} in toolbelt`,
      disabled: profile.coins < 45
    },
    {
      id: "energy",
      icon: BatteryCharging,
      name: "Energy drink",
      detail: "Restore 3 energy for tending your product plots.",
      price: 35,
      owned: `${energy}/${maxEnergy} energy`,
      disabled: profile.coins < 35 || energy >= maxEnergy
    },
    {
      id: "plot",
      icon: MapPinned,
      name: "New product plot",
      detail: "Unlock one more piece of land for a product idea.",
      price: 280,
      owned: `${profile.plotLimit ?? 6}/8 plots unlocked`,
      disabled: profile.coins < 280 || (profile.plotLimit ?? 6) >= 8
    }
  ];

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal market-modal" role="dialog" aria-modal="true" aria-labelledby="market-title">
        <header className="modal__head">
          <div><small>VILLAGE MARKET</small><h2 id="market-title">Little boosts, better products</h2><p>Spend coins on the next small action that helps your garden grow.</p></div>
          <button type="button" className="icon" onClick={onClose} aria-label="Close village market"><X size={17} /></button>
        </header>
        <div className="market-wallet"><span><Coins size={13} /> {profile.coins} coins</span><span><Zap size={13} /> {energy}/{maxEnergy} energy</span><span><Sprout size={13} /> {profile.fertilizer ?? 0} fertilizer</span><span><MapPinned size={13} /> {profile.plotLimit ?? 6}/8 plots</span></div>
        <div className="market-list">
          {items.map((item) => {
            const Icon = item.icon;
            return <article className="market-item" key={item.id}>
              <span className="market-item__icon"><Icon size={18} /></span>
              <div className="market-item__copy"><strong>{item.name}</strong><small>{item.detail}</small><em>{item.owned}</em></div>
              <button type="button" className="primary market-item__buy" disabled={item.disabled} onClick={() => onBuy(item.id)}><Coins size={12} /> {item.price}</button>
            </article>;
          })}
        </div>
        <p className="market-note">Coins return when you ship and harvest a release.</p>
      </section>
    </div>
  );
};
