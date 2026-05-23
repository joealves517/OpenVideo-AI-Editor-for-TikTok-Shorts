import { useEffect, useState } from "react";
import { Effect, getEffectOptions, VALUES_FILTER_SPECIAL } from "@openvideo/engine-pixi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatFilterName } from "@/utils/effects";
import { core } from "@/lib/project";
import Draggable from "@/components/shared/draggable";

const EFFECT_DURATION_DEFAULT = 5000000;

const gridClasses = `
  grid
  grid-cols-[repeat(auto-fill,minmax(80px,1fr))]
  gap-4
  justify-items-center
`;

type EffectCardProps = {
  label: string;
  staticSrc: string;
  dynamicSrc: string;
  onClick: () => void;
  badge?: string;
};

const EffectCard = ({ label, staticSrc, dynamicSrc, onClick, badge }: EffectCardProps) => {
  const [isDynamicLoaded, setIsDynamicLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Draggable
      data={{
        type: "Effect",
        name: label,
        display: { from: 0, to: EFFECT_DURATION_DEFAULT },
        duration: EFFECT_DURATION_DEFAULT,
        effect: {
          id: "eff_" + Date.now(),
          key: label, // We use label as a placeholder if key is not passed, but cards are rendered by components that know the key
          name: label,
        },
      }}
      renderCustomPreview={
        <div className="w-20 aspect-video rounded-md overflow-hidden shadow-xl border-2 border-primary bg-zinc-900 flex items-center justify-center">
          <span className="text-[10px] text-white font-medium px-2 text-center">{label}</span>
        </div>
      }
    >
      <div
        className="flex w-full flex-col items-center gap-2 cursor-pointer group"
        onClick={onClick}
        onMouseEnter={() => {
          setIsHovering(true);

          if (!isDynamicLoaded) {
            const img = new Image();
            img.src = dynamicSrc;
          }
        }}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative w-full aspect-video rounded-md bg-input/30 border overflow-hidden">
          {staticSrc || dynamicSrc ? (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-200"
              style={{
                backgroundImage: `url(${isHovering && isDynamicLoaded ? dynamicSrc : staticSrc})`,
              }}
              onLoad={() => {
                // Background images don't have onLoad on the div, but we preloaded the dynamic one
                if (isHovering) setIsDynamicLoaded(true);
              }}
            />
          ) : (
            <div className="text-xs text-muted-foreground text-center px-2 bg-primary/40 h-full w-full"></div>
          )}
          {isHovering && dynamicSrc && !isDynamicLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {badge && (
            <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
              {badge}
            </div>
          )}

          <div
            className={`absolute bottom-0 left-0 w-full p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs font-medium truncate text-center transition-opacity duration-200 ${
              dynamicSrc ? "group-hover:opacity-0" : ""
            }`}
          >
            {label}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

// ─── Default Effects ──────────────────────────────────────────────────────────

const EffectDefault = () => {
  const effects = getEffectOptions();
  const specialEffects = Object.keys(VALUES_FILTER_SPECIAL).map((filterName) => ({
    key: filterName,
    label: formatFilterName(filterName),
    previewStatic: `https://cdn.subgen.co/previews/effects/static/effect_${filterName}_static.webp`,
    previewDynamic: `https://cdn.subgen.co/previews/effects/dynamic/effect_${filterName}_dynamic.webp`,
  }));
  const allEffects = [...specialEffects, ...effects];

  const handleClick = async (key: string) => {
    const effectValues: Record<string, any> = {};
    if (key === "embossFilter") effectValues.strength = 5;
    if (key === "pixelateFilter") effectValues.size = 10;

    await core.clip.add({
      type: "Effect",
      name: formatFilterName(key),
      display: { from: 0, to: EFFECT_DURATION_DEFAULT },
      duration: EFFECT_DURATION_DEFAULT,
      effect: {
        id: "eff_" + Date.now(),
        key: key,
        name: key,
        values: effectValues,
      },
    });
  };

  return (
    <>
      {allEffects.map((effect) => (
        <EffectCard
          key={effect.key}
          label={effect.label}
          staticSrc={effect.previewStatic}
          dynamicSrc={effect.previewDynamic}
          onClick={() => handleClick(effect.key)}
        />
      ))}
    </>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

const PanelEffect = () => {
  return (
    <div className="p-4 h-full">
      <ScrollArea className="h-full">
        <div className={gridClasses}>
          <EffectDefault />
        </div>
      </ScrollArea>
    </div>
  );
};

export default PanelEffect;
