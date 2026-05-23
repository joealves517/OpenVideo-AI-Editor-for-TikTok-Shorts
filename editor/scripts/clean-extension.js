import fs from "fs";
import path from "path";
import crypto from "crypto";

const OUT_DIR = path.resolve("out");

/**
 * Recurse through directory to find files by extension
 */
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

/**
 * Clean inline scripts, rename system reserved directories, and optimize for Chrome Extension environment
 */
function cleanExtension() {
  console.log(`[Clean-Extension] Starting post-build cleanup in: ${OUT_DIR}`);

  if (!fs.existsSync(OUT_DIR)) {
    console.error(`[Clean-Extension] Error: ${OUT_DIR} does not exist! Run next build first.`);
    process.exit(1);
  }

  // 1. Rename _not-found.html to not-found.html
  const oldNotFound = path.join(OUT_DIR, "_not-found.html");
  const newNotFound = path.join(OUT_DIR, "not-found.html");
  if (fs.existsSync(oldNotFound)) {
    fs.renameSync(oldNotFound, newNotFound);
    console.log(`[Clean-Extension] Renamed _not-found.html to not-found.html`);
  }

  // 1b. Remove forbidden system-reserved metadata directory _not-found
  const notFoundDir = path.join(OUT_DIR, "_not-found");
  if (fs.existsSync(notFoundDir)) {
    fs.rmSync(notFoundDir, { recursive: true, force: true });
    console.log(`[Clean-Extension] Removed system-reserved metadata directory: _not-found`);
  }

  // 2. Remove forbidden system-reserved meta-files starting with "_" or "__"
  fs.readdirSync(OUT_DIR).forEach((f) => {
    const fullPath = path.join(OUT_DIR, f);
    const stat = fs.statSync(fullPath);
    if (!stat.isDirectory()) {
      if (
        f.startsWith("__next") ||
        f.startsWith("_not-found.txt") ||
        (f.startsWith("_") && f.endsWith(".txt"))
      ) {
        fs.unlinkSync(fullPath);
        console.log(`[Clean-Extension] Removed system-reserved metadata file: ${f}`);
      }
    }
  });

  // 3. Rename _next directory to next
  const oldNextDir = path.join(OUT_DIR, "_next");
  const newNextDir = path.join(OUT_DIR, "next");
  if (fs.existsSync(oldNextDir)) {
    fs.renameSync(oldNextDir, newNextDir);
    console.log(`[Clean-Extension] Renamed _next directory to next`);
  }
  // 4. Clean inline scripts in HTML files & replace all _next references
  let htmlFilesCount = 0;
  let inlineScriptsCleaned = 0;

  walkDir(OUT_DIR, (filePath) => {
    const ext = path.extname(filePath);

    // First, replace all "_next/" to "next/" and "_not-found.html" to "not-found.html" in HTML, JS, CSS files
    if ([".html", ".js", ".css"].includes(ext)) {
      let content = fs.readFileSync(filePath, "utf-8");
      let modified = false;

      if (content.includes("_next/")) {
        content = content.replace(/_next\//g, "next/");
        modified = true;
      }
      if (content.includes("_not-found.html")) {
        content = content.replace(/_not-found\.html/g, "not-found.html");
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(filePath, content, "utf-8");
        console.log(
          `[Clean-Extension] Replaced directory references in: ${path.relative(OUT_DIR, filePath)}`,
        );
      }
    }

    // Now, perform CSP extraction for HTML files
    if (ext !== ".html") return;

    htmlFilesCount++;
    let content = fs.readFileSync(filePath, "utf-8");
    let modified = false;

    // 1. Remove speculative prefetching script tags which are forbidden/non-functional in Extensions
    const speculationRulesRegex =
      /<script\b[^>]*type=["']speculationrules["'][^>]*>([\s\S]*?)<\/script>/gi;
    const cleanSpecContent = content.replace(speculationRulesRegex, "");
    if (cleanSpecContent !== content) {
      content = cleanSpecContent;
      modified = true;
      console.log(
        `[Clean-Extension] Removed speculationrules script tag in ${path.basename(filePath)}`,
      );
    }

    // 2. Regular expression to find all inline <script> blocks (excluding tags with src attribute)
    const inlineScriptRegex = /<script(?![^>]*\bsrc\b)([^>]*)>([\s\S]*?)<\/script>/gi;

    content = content.replace(inlineScriptRegex, (match, attributes, scriptBody) => {
      const trimmedBody = scriptBody.trim();
      if (!trimmedBody) return match; // Keep empty script tags

      // If it is a JSON script (like type="application/json"), do NOT extract it to external JS
      if (
        attributes.includes('type="application/json"') ||
        attributes.includes("type='application/json'") ||
        attributes.includes('type="text/')
      ) {
        return match;
      }

      // Generate a unique filename based on the script content hash
      const hash = crypto.createHash("sha256").update(trimmedBody).digest("hex").substring(0, 16);
      const scriptFilename = `inline-${hash}.js`;
      const scriptPath = path.join(OUT_DIR, scriptFilename);

      // Write the inline code to a dedicated external JS file
      fs.writeFileSync(scriptPath, trimmedBody, "utf-8");
      inlineScriptsCleaned++;
      modified = true;

      console.log(
        `[Clean-Extension] Extracted inline script from ${path.basename(filePath)} -> ${scriptFilename}`,
      );
      return `<script src="${scriptFilename}"${attributes}></script>`;
    });

    // 3. Next.js sometimes inserts 'onload' inline attributes on <link> tags for CSS loading.
    // Chrome CSP also rejects inline event handlers like onload. Let's convert them safely!
    const inlineOnloadRegex = /<link([^>]*)\bonload="([^"]*)"([^>]*)>/gi;
    let linkIdCounter = 0;

    content = content.replace(inlineOnloadRegex, (tag, before, onloadCode, after) => {
      linkIdCounter++;
      const linkId = `link-onload-${linkIdCounter}`;

      // Create an external script to run the onload logic safely
      const hash = crypto.createHash("sha256").update(onloadCode).digest("hex").substring(0, 16);
      const onloadFilename = `onload-${hash}.js`;
      const onloadPath = path.join(OUT_DIR, onloadFilename);

      // Replace 'this' with a targeted ID selector for absolute reliability
      const resolvedCode = onloadCode.replace(/\bthis\b/g, `document.getElementById('${linkId}')`);

      fs.writeFileSync(
        onloadPath,
        `document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('${linkId}');
        if (el) {
          ${resolvedCode};
        }
      });`,
        "utf-8",
      );

      inlineScriptsCleaned++;
      modified = true;
      console.log(
        `[Clean-Extension] Extracted inline onload from link in ${path.basename(filePath)} -> ${onloadFilename}`,
      );

      return `<link id="${linkId}"${before}${after}><script src="${onloadFilename}"></script>`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, "utf-8");
    }
  });

  console.log(`[Clean-Extension] Cleanup finished.`);
  console.log(`[Clean-Extension] Processed ${htmlFilesCount} HTML files.`);
  console.log(
    `[Clean-Extension] Created ${inlineScriptsCleaned} external JS files to satisfy CSP.`,
  );
}

cleanExtension();
