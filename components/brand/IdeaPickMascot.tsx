import { cn } from '@/lib/utils';
import type { ScoreTier } from '@/lib/validate/score-tier';

type IdeaPickMascotProps = {
  className?: string;
  background?: boolean;
  // When set, shows the score reveal: the bulb turns on/flickers/fizzles and the
  // sparks burst per tier. Omitted → the static mascot (bulb always lit), used by
  // the loading journey and anywhere else.
  reveal?: ScoreTier;
  // Only meaningful with `reveal`. true (default) plays the one-shot animation;
  // false renders the tier's resting end-state (already-seen report) with no
  // animation.
  play?: boolean;
};

// Class names are namespaced with `ipm-` so the inlined <style> block cannot
// leak onto unrelated elements in the document.
const STYLES = `
  .ipm-bg{fill:#111821}
  .ipm-shadow{fill:#0b1017;opacity:.35}
  .ipm-outline{fill:#05080d}
  .ipm-body{fill:#9be7ff}
  .ipm-body2{fill:#79d5ff}
  .ipm-body3{fill:#55bdf3}
  .ipm-hi{fill:#c9f5ff}
  .ipm-bulb{fill:#d8fbff}
  .ipm-bulb2{fill:#aeeeff}
  .ipm-bulb3{fill:#7fd6ff}
  .ipm-base{fill:#34384f}
  .ipm-base2{fill:#505773}
  .ipm-face{fill:#060910}
  .ipm-spark{fill:#bff4ff}
  .ipm-white{fill:#ffffff}

  /* Reveal: each tier has a resting end-state (the opacities below). When the
     animation plays it starts dark and lands on that state via fill-mode; when
     rested or reduced-motion, the resting state shows immediately. */
  [data-reveal] .ipm-bulb-grp,[data-reveal] .ipm-spark-grp{
    transform-box:fill-box;transform-origin:center}
  [data-reveal="strong"] .ipm-bulb-grp{opacity:1}
  [data-reveal="promising"] .ipm-bulb-grp{opacity:.85}
  [data-reveal="weak"] .ipm-bulb-grp{opacity:.18}
  [data-reveal="strong"] .ipm-spark-grp{opacity:.28}
  [data-reveal="promising"] .ipm-spark-grp{opacity:.12}
  [data-reveal="weak"] .ipm-spark-grp{opacity:0}

  /* Play the one-shot per-tier timeline (~2.5s) unless rested or reduced-motion.
     fill:both holds the keyframes' 0% (opacity:0) before the delay elapses, so
     the bulb stays dark until it "turns on" — no first-frame flash. */
  [data-reveal]:not([data-rest]) .ipm-bulb-grp,
  [data-reveal]:not([data-rest]) .ipm-spark-grp{animation:2.5s ease both}
  [data-reveal="strong"]:not([data-rest]) .ipm-bulb-grp{animation-name:ipm-bulb-strong}
  [data-reveal="promising"]:not([data-rest]) .ipm-bulb-grp{animation-name:ipm-bulb-promising}
  [data-reveal="weak"]:not([data-rest]) .ipm-bulb-grp{animation-name:ipm-bulb-weak}
  [data-reveal="strong"]:not([data-rest]) .ipm-spark-grp{animation-name:ipm-spark-strong}
  [data-reveal="promising"]:not([data-rest]) .ipm-spark-grp{animation-name:ipm-spark-promising}

  @keyframes ipm-bulb-strong{
    0%,42%{opacity:0}
    50%{opacity:.25}55%{opacity:1}60%{opacity:.5}66%{opacity:1}100%{opacity:1}}
  @keyframes ipm-bulb-promising{
    0%,42%{opacity:0}
    50%{opacity:.3}56%{opacity:.1}63%{opacity:.6}70%{opacity:.3}80%{opacity:.85}100%{opacity:.85}}
  @keyframes ipm-bulb-weak{
    0%,42%{opacity:0}
    50%{opacity:.45}55%{opacity:.12}60%{opacity:.5}65%{opacity:.15}74%{opacity:.3}100%{opacity:.18}}
  @keyframes ipm-spark-strong{
    0%,50%{opacity:0;transform:scale(.6)}
    58%{opacity:1;transform:scale(1.15)}72%{opacity:.0;transform:scale(1.35)}
    85%{opacity:.28;transform:scale(1)}100%{opacity:.28;transform:scale(1)}}
  @keyframes ipm-spark-promising{
    0%,54%{opacity:0;transform:scale(.7)}
    64%{opacity:.5;transform:scale(1.1)}80%{opacity:.12;transform:scale(1)}100%{opacity:.12}}

  /* Reduced motion: never animate; show the tier's resting state immediately. */
  @media (prefers-reduced-motion: reduce){
    [data-reveal] .ipm-bulb-grp,[data-reveal] .ipm-spark-grp{animation:none}
    [data-reveal="strong"] .ipm-bulb-grp{opacity:1}
    [data-reveal="promising"] .ipm-bulb-grp{opacity:.85}
    [data-reveal="weak"] .ipm-bulb-grp{opacity:.18}
    [data-reveal="strong"] .ipm-spark-grp{opacity:.28}
    [data-reveal="promising"] .ipm-spark-grp{opacity:.12}
  }
`;

// Idy's mouth changes with the verdict: grin when the idea is strong, the
// default smile when promising, a flat/down mouth when weak.
function Mouth({ reveal }: { reveal?: ScoreTier }) {
  if (reveal === 'strong') {
    return (
      <>
        <rect className="ipm-face" x="29.5" y="40" width="1.5" height="1.5" />
        <rect className="ipm-face" x="34" y="40" width="1.5" height="1.5" />
        <rect className="ipm-face" x="30.5" y="41.5" width="4.5" height="1.5" />
      </>
    );
  }
  if (reveal === 'weak') {
    return (
      <>
        <rect className="ipm-face" x="30" y="42" width="1" height="1" />
        <rect className="ipm-face" x="34.5" y="42" width="1" height="1" />
        <rect className="ipm-face" x="31" y="41.5" width="3.5" height="1.5" />
      </>
    );
  }
  // smile (promising and the static default)
  return (
    <>
      <rect className="ipm-face" x="30" y="40" width="1.5" height="1.5" />
      <rect className="ipm-face" x="34" y="40" width="1.5" height="1.5" />
      <rect className="ipm-face" x="31.5" y="41.5" width="3" height="1.5" />
    </>
  );
}

export function IdeaPickMascot({
  className,
  background = true,
  reveal,
  play = true,
}: IdeaPickMascotProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="IdeaPick mascot"
      shapeRendering="crispEdges"
      className={cn('block', className)}
      data-reveal={reveal}
      data-rest={reveal && !play ? '' : undefined}
    >
      <style>{STYLES}</style>

      {background && <rect className="ipm-bg" width="64" height="64" />}

      <rect className="ipm-shadow" x="20" y="48" width="24" height="2" />
      <rect className="ipm-shadow" x="22" y="50" width="20" height="2" />

      <g className="ipm-spark-grp">
        <rect className="ipm-spark" x="31" y="10" width="2" height="4" />
        <rect className="ipm-spark" x="23" y="15" width="2" height="2" />
        <rect className="ipm-spark" x="25" y="17" width="2" height="2" />
        <rect className="ipm-spark" x="39" y="17" width="2" height="2" />
        <rect className="ipm-spark" x="41" y="15" width="2" height="2" />
        <rect className="ipm-spark" x="20" y="23" width="4" height="2" />
        <rect className="ipm-spark" x="42" y="23" width="4" height="2" />
      </g>

      <g className="ipm-bulb-grp">
        <rect className="ipm-bulb2" x="30" y="16" width="6" height="2" />
        <rect className="ipm-bulb" x="28" y="18" width="10" height="4" />
        <rect className="ipm-bulb" x="27" y="22" width="12" height="2" />
        <rect className="ipm-bulb2" x="28" y="24" width="10" height="2" />
        <rect className="ipm-bulb3" x="30" y="26" width="6" height="1" />
        <rect className="ipm-bulb3" x="31" y="22" width="1" height="5" />
        <rect className="ipm-bulb3" x="34" y="22" width="1" height="5" />
        <rect className="ipm-bulb3" x="32" y="25" width="2" height="1" />
        <rect className="ipm-white" x="34" y="18" width="2" height="2" />
        <rect className="ipm-white" x="36" y="20" width="1" height="2" />
      </g>

      <rect className="ipm-base" x="30" y="27" width="6" height="2" />
      <rect className="ipm-base2" x="30" y="29" width="6" height="1" />
      <rect className="ipm-base" x="30" y="30" width="6" height="2" />

      <rect className="ipm-outline" x="24" y="29" width="16" height="2" />
      <rect className="ipm-outline" x="22" y="31" width="20" height="2" />
      <rect className="ipm-outline" x="21" y="33" width="22" height="8" />
      <rect className="ipm-outline" x="20" y="41" width="24" height="6" />
      <rect className="ipm-outline" x="18" y="39" width="4" height="4" />
      <rect className="ipm-outline" x="42" y="39" width="4" height="4" />
      <rect className="ipm-outline" x="23" y="47" width="3" height="4" />
      <rect className="ipm-outline" x="29" y="47" width="2" height="4" />
      <rect className="ipm-outline" x="36" y="47" width="2" height="4" />
      <rect className="ipm-outline" x="40" y="47" width="3" height="4" />

      <rect className="ipm-body2" x="24" y="29" width="16" height="2" />
      <rect className="ipm-body" x="22" y="31" width="20" height="2" />
      <rect className="ipm-body" x="21" y="33" width="22" height="8" />
      <rect className="ipm-body" x="20" y="41" width="24" height="5" />
      <rect className="ipm-body" x="18" y="40" width="4" height="2" />
      <rect className="ipm-body" x="42" y="40" width="4" height="2" />

      <rect className="ipm-body2" x="21" y="33" width="2" height="13" />
      <rect className="ipm-body2" x="20" y="43" width="24" height="3" />
      <rect className="ipm-body3" x="22" y="31" width="2" height="2" />
      <rect className="ipm-body3" x="21" y="35" width="2" height="2" />
      <rect className="ipm-body3" x="18" y="42" width="4" height="1" />
      <rect className="ipm-body3" x="42" y="42" width="4" height="1" />
      <rect className="ipm-body3" x="23" y="47" width="2" height="3" />
      <rect className="ipm-body2" x="25" y="47" width="1" height="4" />
      <rect className="ipm-body2" x="29" y="47" width="2" height="4" />
      <rect className="ipm-body2" x="36" y="47" width="2" height="4" />
      <rect className="ipm-body2" x="40" y="47" width="2" height="4" />
      <rect className="ipm-hi" x="24" y="31" width="4" height="2" />
      <rect className="ipm-hi" x="23" y="33" width="2" height="2" />

      <rect className="ipm-face" x="25" y="36" width="3" height="4" />
      <rect className="ipm-face" x="36" y="36" width="3" height="4" />
      <Mouth reveal={reveal} />
    </svg>
  );
}
