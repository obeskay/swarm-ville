import { Map, MousePointer2, Sprout, X } from "lucide-react";

interface Props {
  onCreate: () => void;
  onExplore: () => void;
  onClose: () => void;
}

export const GuideCard = ({ onCreate, onExplore, onClose }: Props) => (
  <section className="panel guide" aria-label="Getting started">
    <header className="guide__head"><div><h2>Grow your next product</h2></div><button type="button" className="icon" onClick={onClose} aria-label="Close guide"><X size={14} /></button></header>
    <p>Every idea becomes a plot. Five agents plan it, build it, review it and ship it.</p>
    <ol className="guide__steps">
      <li><span><MousePointer2 size={13} /></span><strong>Pick a plot</strong></li>
      <li><span><Sprout size={13} /></span><strong>Plant an idea</strong></li>
      <li><span><Map size={13} /></span><strong>Harvest the release</strong></li>
    </ol>
    <div className="guide__actions"><button type="button" className="primary" onClick={onCreate}><Sprout size={13} /> Plant a product</button><button type="button" className="secondary" onClick={onExplore}>Explore the village</button></div>
  </section>
);
