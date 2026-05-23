import fs from "fs";
import path from "path";

const ACADEMY_DATA_DIR = path.resolve(
  "/Users/alvesoscar517gmail.com/projects/openvideo/editor/public/academy-data",
);

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

console.log("[Script] Starting global affiliate link replacement in: " + ACADEMY_DATA_DIR);

let modifiedFilesCount = 0;
let replacedLinksCount = 0;

walkDir(ACADEMY_DATA_DIR, (filePath) => {
  if (!filePath.endsWith(".md")) return;

  const content = fs.readFileSync(filePath, "utf8");

  // Regex to match any variant of openvideo affiliate link:
  // https://openvideo/?via=chris56
  // https://openvideo/
  // https://openvideo
  const targetRegex = /https:\/\/openvideo(?:\/\?via=chris56|\/|\b)?/gi;

  if (targetRegex.test(content)) {
    // Count matches
    const matches = content.match(targetRegex);
    replacedLinksCount += matches ? matches.length : 0;

    // Replace all with local app root path '/'
    const updatedContent = content.replace(targetRegex, "/");
    fs.writeFileSync(filePath, updatedContent, "utf8");

    console.log(
      `[Replaced] ${path.relative(ACADEMY_DATA_DIR, filePath)} (${matches ? matches.length : 0} links)`,
    );
    modifiedFilesCount++;
  }
});

console.log(`\n[Finished] Total files modified: ${modifiedFilesCount}`);
console.log(`[Finished] Total links replaced: ${replacedLinksCount}`);
