import fs from "fs";
import path from "path";

const ACADEMY_DIR = path.resolve(
  "/Users/alvesoscar517gmail.com/projects/openvideo/editor/public/academy-data",
);

const ATTRIBUTION_TEXT = `

---

## 📄 License & Credits

This learning resource is localized, customized, and compiled by the **OpenVideo Team**, inspired by the incredible open-source community course created by **Chris Porter**. We highly appreciate the contributions of open-source creators to community education.
`;

// Helper to recursively list all files in a directory
function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignore hidden directories like .git
      if (!file.startsWith(".")) {
        getFilesRecursively(filePath, fileList);
      }
    } else if (file.endsWith(".md")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main logic to process and localize a markdown file
function localizeMarkdownFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const originalLength = content.length;

  // 1. Swap product brand names
  content = content
    .replace(/Syllaby\.io/g, "OpenVideo Editor")
    .replace(/Syllaby/g, "OpenVideo")
    .replace(/syllaby\.io/g, "openvideo")
    .replace(/Syllaby account/g, "OpenVideo Workspace")
    .replace(/Syllaby accounts/g, "OpenVideo Workspaces")
    .replace(/Syllaby feature/g, "OpenVideo feature")
    .replace(/Syllaby features/g, "OpenVideo features")
    .replace(/Syllaby subscription/g, "OpenVideo editor")
    .replace(/Syllaby pricing/g, "OpenVideo features");

  // 2. Remove Chris Porter's personal affiliate links and clean up URLs
  // Replace Syllaby affiliate links with internal editor route '/'
  content = content.replace(/https:\/\/syllaby\.io\/\?via=[a-zA-Z0-9_]+/g, "/");

  // 3. Remove buy me a coffee references
  content = content.replace(/.*buymeacoffee\.com.*/gi, "");
  content = content.replace(/.*Buy Me A Coffee.*/gi, "");

  // 4. Remove star repo calls and badge links
  content = content.replace(/.*Star History Chart.*/gi, "");
  content = content.replace(/.*If You Find This Course\/Guide Helpful.*/gi, "");
  content = content.replace(/.*Star This Repo.*/gi, "");
  content = content.replace(/.*stars\.githubusercontent\.com.*/gi, "");

  // 5. Remove Chris Porter Facebook follow details
  content = content.replace(/.*Follow the Creator.*/gi, "");
  content = content.replace(/.*Chris Porter.*/gi, "");
  content = content.replace(/.*facebook\.com\/chris\.porter.*/gi, "");
  content = content.replace(/.*Follow on Facebook.*/gi, "");

  // 6. Clean up residual double separators or empty blocks left from removals
  content = content.replace(/---\s*---/g, "---").replace(/\n{3,}/g, "\n\n");

  // 7. Inject trân trọng ghi nhận cảm ơn Chris Porter ở chân trang if not already present
  if (!content.includes("License & Credits") && !content.includes("Chris Porter")) {
    content = content.trim() + ATTRIBUTION_TEXT;
  }

  // Write changes back only if file actually modified
  if (content.length !== originalLength) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[Localizer] Localized and synced: ${path.relative(ACADEMY_DIR, filePath)}`);
    return true;
  }

  return false;
}

// Execution
try {
  console.log(`[Localizer] Scanning academy directory: ${ACADEMY_DIR}`);
  const mdFiles = getFilesRecursively(ACADEMY_DIR);
  console.log(`[Localizer] Found ${mdFiles.length} markdown files to analyze.`);

  let modifiedCount = 0;
  mdFiles.forEach((file) => {
    if (localizeMarkdownFile(file)) {
      modifiedCount++;
    }
  });

  console.log(`[Localizer] Completed! Localized and updated ${modifiedCount} files successfully.`);
} catch (error) {
  console.error("[Localizer] Error during localization script execution:", error);
}
