import { cn } from '@/lib/utils';

type IdeaPickMascotProps = {
  className?: string;
  background?: boolean;
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
`;

export function IdeaPickMascot({ className, background = true }: IdeaPickMascotProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="IdeaPick mascot"
      shapeRendering="crispEdges"
      className={cn('block', className)}
    >
      <style>{STYLES}</style>

      {background && <rect className="ipm-bg" width="64" height="64" />}

      <rect className="ipm-shadow" x="20" y="48" width="24" height="2" />
      <rect className="ipm-shadow" x="22" y="50" width="20" height="2" />

      <rect className="ipm-spark" x="31" y="10" width="2" height="4" />
      <rect className="ipm-spark" x="23" y="15" width="2" height="2" />
      <rect className="ipm-spark" x="25" y="17" width="2" height="2" />
      <rect className="ipm-spark" x="39" y="17" width="2" height="2" />
      <rect className="ipm-spark" x="41" y="15" width="2" height="2" />
      <rect className="ipm-spark" x="20" y="23" width="4" height="2" />
      <rect className="ipm-spark" x="42" y="23" width="4" height="2" />

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
      <rect className="ipm-face" x="30" y="40" width="1.5" height="1.5" />
      <rect className="ipm-face" x="34" y="40" width="1.5" height="1.5" />
      <rect className="ipm-face" x="31.5" y="41.5" width="3" height="1.5" />
    </svg>
  );
}
