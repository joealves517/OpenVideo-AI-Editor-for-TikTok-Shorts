"use client";

import { core } from "@/lib/project";
import { Log } from "@openvideo/engine-pixi";
import Draggable from "@/components/shared/draggable";
import { generateShapeSvg, ShapeType } from "@/utils/shapes";

const SHAPES = [
  { key: "ellipse", name: "Ellipse" },
  { key: "square", name: "Square" },
  { key: "triangle", name: "Triangle" },
  { key: "polygon", name: "Polygon" },
  { key: "hexagon", name: "Hexagon" },
  { key: "star", name: "Star" },
  { key: "arrow", name: "Arrow" },
  { key: "heart", name: "Heart" },
  { key: "speechBubble", name: "Speech Bubble" },
];

export default function PanelElements() {
  const handleAddShape = async (shapeKey: ShapeType, shapeName: string) => {
    try {
      const defaultColor = "#3b82f6"; // Beautiful accent blue
      const svgSrc = generateShapeSvg(shapeKey, defaultColor, "#ffffff", 0);

      await core.clip.add({
        type: "Image",
        src: svgSrc,
        name: shapeName,
        display: { from: 0, to: 5_000_000 },
        left: 200,
        top: 200,
        width: 200,
        height: 200,
        metadata: {
          isShape: true,
          shapeType: shapeKey,
          fillColor: defaultColor,
          strokeColor: "#ffffff",
          strokeWidth: 0,
        },
      });
    } catch (error) {
      Log.error("Failed to add shape:", error);
    }
  };

  const renderShapeIcon = (key: string) => {
    switch (key) {
      case "ellipse":
        return <div className="w-12 h-12 bg-white rounded-full" />;
      case "square":
        return <div className="w-10 h-10 bg-white rounded-md" />;
      case "triangle":
        return (
          <div
            className="w-12 h-12 bg-white"
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          />
        );
      case "polygon":
        return (
          <div
            className="w-12 h-12 bg-white"
            style={{
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
            }}
          />
        );
      case "hexagon":
        return (
          <div
            className="w-12 h-12 bg-white"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          />
        );
      case "star":
        return (
          <div
            className="w-12 h-12 bg-white"
            style={{
              clipPath:
                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            }}
          />
        );
      case "arrow":
        return (
          <div
            className="w-12 h-12 bg-white"
            style={{
              clipPath: "polygon(0% 35%, 60% 35%, 60% 15%, 100% 50%, 60% 85%, 60% 65%, 0% 65%)",
            }}
          />
        );
      case "heart":
        return (
          <svg viewBox="0 0 100 100" className="w-12 h-12 fill-white">
            <path d="M50,30 C50,10 20,10 20,35 C20,60 50,85 50,85 C50,85 80,60 80,35 C80,10 50,10 50,30 Z" />
          </svg>
        );
      case "speechBubble":
        return (
          <svg viewBox="0 0 100 100" className="w-12 h-12 fill-white">
            <path d="M10,20 L90,20 C95,20 95,25 95,25 L95,65 C95,70 90,70 90,70 L50,70 L30,90 L30,70 L10,70 C5,70 5,65 5,65 L5,25 C5,20 10,20 10,20 Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-4 h-full flex flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center text-sm font-medium">
        Elements
      </div>
      <div className="flex-1 overflow-y-auto pb-6 pr-1">
        <div className="grid grid-cols-3 gap-4">
          {SHAPES.map((shape) => (
            <div key={shape.key} className="flex flex-col gap-2">
              <Draggable
                data={{
                  type: "Image",
                  src: generateShapeSvg(shape.key as ShapeType, "#3b82f6", "#ffffff", 0),
                  name: shape.name,
                  duration: 5_000_000,
                  width: 200,
                  height: 200,
                  metadata: {
                    isShape: true,
                    shapeType: shape.key,
                    fillColor: "#3b82f6",
                    strokeColor: "#ffffff",
                    strokeWidth: 0,
                  },
                }}
                renderCustomPreview={
                  <div className="w-16 h-16 bg-black/80 rounded-xl border-2 border-primary shadow-2xl flex items-center justify-center p-2">
                    {renderShapeIcon(shape.key)}
                  </div>
                }
              >
                <div
                  onClick={() => handleAddShape(shape.key as ShapeType, shape.name)}
                  className="aspect-square bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-200"
                >
                  <div className="w-16 h-16 flex items-center justify-center">
                    {renderShapeIcon(shape.key)}
                  </div>
                </div>
              </Draggable>
              <span className="text-[10px] text-white/50 text-center truncate">{shape.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
