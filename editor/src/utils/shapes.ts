export type ShapeType =
  | "ellipse"
  | "square"
  | "triangle"
  | "polygon"
  | "hexagon"
  | "star"
  | "arrow"
  | "heart"
  | "speechBubble";

export function generateShapeSvg(
  type: ShapeType,
  fillColor: string,
  strokeColor?: string,
  strokeWidth?: number,
): string {
  const fill = fillColor;
  const stroke = strokeColor ?? "none";
  const sw = strokeWidth ?? 0;

  let elementHtml = "";

  switch (type) {
    case "ellipse":
      elementHtml = `<ellipse cx="50" cy="50" rx="45" ry="45" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    case "square":
      elementHtml = `<rect x="${5 + sw / 2}" y="${5 + sw / 2}" width="${90 - sw}" height="${90 - sw}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    case "triangle":
      elementHtml = `<polygon points="50,5 95,90 5,90" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    case "polygon":
      elementHtml = `<polygon points="50,5 95,38 78,92 22,92 5,38" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    case "hexagon":
      elementHtml = `<polygon points="50,5 90,28 90,72 50,95 10,72 10,28" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    case "star":
      elementHtml = `<polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    case "arrow":
      elementHtml = `<path d="M10,35 L60,35 L60,15 L95,50 L60,85 L60,65 L10,65 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    case "heart":
      elementHtml = `<path d="M50,30 C50,10 20,10 20,35 C20,60 50,85 50,85 C50,85 80,60 80,35 C80,10 50,10 50,30 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    case "speechBubble":
      elementHtml = `<path d="M10,20 L90,20 C95,20 95,25 95,25 L95,65 C95,70 90,70 90,70 L50,70 L30,90 L30,70 L10,70 C5,70 5,65 5,65 L5,25 C5,20 10,20 10,20 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
      break;
    default:
      elementHtml = `<ellipse cx="50" cy="50" rx="45" ry="45" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${elementHtml}</svg>`;

  // Safe base64 encoding for browser environment
  const base64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(svgContent)))
      : Buffer.from(svgContent).toString("base64");

  return `data:image/svg+xml;base64,${base64}`;
}
