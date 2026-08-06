import { Map, MousePointer2, Sprout, X } from "lucide-react";

interface Props {
  onCreate: () => void;
  onExplore: () => void;
  onClose: () => void;
}

export const GuideCard = ({ onCreate, onExplore, onClose }: Props) => (
  <section className="panel guide" aria-label="Getting started">
    <header className="guide__head"><div><small>WELCOME TO THE VILLAGE</small><h2>Grow your next product</h2></div><button type="button" className="icon" onClick={onClose} aria-label="Close guide"><X size={14} /></button></header>
    <p>Every idea becomes a living plot. Your agents plan it, build it, review it and ship it.</p>
    <ol className="guide__steps">
      <li><span><MousePointer2 size={13} /></span><div><strong>Pick a plot</strong><small>Click a garden or explore the map.</small></div></li>
      <li><span><Sprout size={13} /></span><div><strong>Plant an idea</strong><small>Name the smallest useful version.</small></div></li>
      <li><span><Map size={13} /></span><div><strong>Watch it grow</strong><small>Harvest the release when it ships.</small></div></li>
    </ol>
    <div className="guide__actions"><button type="button" className="primary" onClick={onCreate}><Sprout size={13} /> Plant a product</button><button type="button" className="secondary" onClick={onExplore}>Explore the village</button></div>
  </section>
);
