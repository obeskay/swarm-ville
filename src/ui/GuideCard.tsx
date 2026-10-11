import { Map, MousePointer2, Sprout, X } from "lucide-react";

interface Props {
  onCreate: () => void;
  onExplore: () => void;
  onClose: () => void;
}

export const GuideCard = ({ onCreate, onExplore, onClose }: Props) => (
  <section className="panel guide" aria-label="Getting started">
    <header className="guide__head"><div><h2>Give the agents a job</h2></div><button type="button" className="icon" onClick={onClose} aria-label="Close guide"><X size={14} /></button></header>
    <p>One objective. The loop plans, builds and reviews it.</p>
    <ol className="guide__steps">
      <li><span><MousePointer2 size={13} /></span><strong>Pick a plot</strong></li>
      <li><span><Sprout size={13} /></span><strong>Plant an idea</strong></li>
      <li><span><Map size={13} /></span><strong>Harvest the release</strong></li>
    </ol>
    <div className="guide__actions"><button type="button" className="primary" onClick={onCreate}><Sprout size={13} /> Plant a product</button><button type="button" className="secondary" onClick={onExplore}>Explore the village</button></div>
  </section>
);
