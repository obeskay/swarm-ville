import { Check, Palette, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { AvatarProfile } from "./shared";

interface Props { open: boolean; avatar: AvatarProfile; onClose: () => void; onSave: (avatar: AvatarProfile) => void; }

const accents = ["#e0a86b", "#8fbf8a", "#7fa8d4", "#d98878", "#c9a2d4"];
const skins = ["#f0d7bd", "#d69b76", "#ae7353", "#f3c9a1", "#8f5c43"];

export const AvatarModal = ({ open, avatar, onClose, onSave }: Props) => {
  const [name, setName] = useState(avatar.name);
  const [accent, setAccent] = useState(avatar.accent);
  const [skin, setSkin] = useState(avatar.skin);

  useEffect(() => {
    if (!open) return;
    setName(avatar.name);
    setAccent(avatar.accent);
    setSkin(avatar.skin);
  }, [avatar, open]);

  if (!open) return null;
  const valid = name.trim().length >= 2;

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal avatar-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-title">
        <header className="modal__head"><div><small>AVATAR LOCKER</small><h2 id="avatar-title">Make yourself at home</h2><p>Your look follows you through the village and the commons.</p></div><button type="button" className="icon" onClick={onClose} aria-label="Close avatar locker"><X size={17} /></button></header>
        <form className="avatar-form" onSubmit={(event) => { event.preventDefault(); if (valid) onSave({ name: name.trim(), accent, skin }); }}>
          <div className="avatar-preview" style={{ "--avatar-accent": accent, "--avatar-skin": skin } as CSSProperties}><span className="avatar-preview__head" /><span className="avatar-preview__body" /><strong>{name.trim() || "You"}</strong></div>
          <label htmlFor="avatar-name">Village name</label><input id="avatar-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={24} placeholder="e.g. Nova" autoFocus />
          <span className="avatar-form__label"><Palette size={11} /> Outfit color</span><div className="swatch-grid">{accents.map((color) => <button key={color} type="button" className={color === accent ? "selected" : ""} style={{ background: color }} onClick={() => setAccent(color)} aria-label={`Choose outfit color ${color}`} aria-pressed={color === accent}>{color === accent && <Check size={13} />}</button>)}</div>
          <span className="avatar-form__label"><UserRound size={11} /> Skin tone</span><div className="swatch-grid swatch-grid--skin">{skins.map((color) => <button key={color} type="button" className={color === skin ? "selected" : ""} style={{ background: color }} onClick={() => setSkin(color)} aria-label={`Choose skin tone ${color}`} aria-pressed={color === skin}>{color === skin && <Check size={13} />}</button>)}</div>
          <div className="modal__actions"><button type="button" className="secondary" onClick={onClose}>Keep current look</button><button type="submit" className="primary" disabled={!valid}><Check size={14} /> Save avatar</button></div>
        </form>
      </section>
    </div>
  );
};
