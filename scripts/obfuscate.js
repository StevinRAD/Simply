/**
 * Script untuk obfuscate file JS extension dari folder src/ ke folder distribusi.
 * Jalankan: npm run obfuscate
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const OBFUSCATOR_OPTS = [
  "--compact true",
  "--string-array true",
  "--string-array-encoding base64",
  "--string-array-threshold 0.75",
  "--split-strings true",
  "--split-strings-chunk-length 5",
  "--identifier-names-generator hexadecimal",
  "--self-defending true",
].join(" ");

// File JS yang perlu di-obfuscate
const FILES = [
  { src: "extensions/src/main/background.js", out: "extensions/main/background.js" },
  { src: "extensions/src/main/crypto.js",     out: "extensions/main/crypto.js" },
  { src: "extensions/src/main/content.js",    out: "extensions/main/content.js" },
  { src: "extensions/src/main/popup.js",      out: "extensions/main/popup.js" },
  { src: "extensions/src/guard/background.js", out: "extensions/guard/background.js" },
  { src: "extensions/src/guard/crypto.js",     out: "extensions/guard/crypto.js" },
  { src: "extensions/src/guard/content.js",    out: "extensions/guard/content.js" },
];

// File non-JS yang perlu di-copy apa adanya
const COPY_FILES = [
  { src: "extensions/src/main/manifest.json", out: "extensions/main/manifest.json" },
  { src: "extensions/src/main/popup.html",    out: "extensions/main/popup.html" },
  { src: "extensions/src/main/popup.css",     out: "extensions/main/popup.css" },
  { src: "extensions/src/guard/manifest.json", out: "extensions/guard/manifest.json" },
  { src: "extensions/src/guard/rules.json",    out: "extensions/guard/rules.json" },
];

const root = path.resolve(__dirname, "..");

console.log("🔒 Obfuscating extension files...\n");

// Obfuscate JS files
for (const file of FILES) {
  const srcPath = path.resolve(root, file.src);
  const outPath = path.resolve(root, file.out);

  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  Skip (not found): ${file.src}`);
    continue;
  }

  try {
    const cmd = `npx javascript-obfuscator "${srcPath}" --output "${outPath}" ${OBFUSCATOR_OPTS}`;
    execSync(cmd, { cwd: root, stdio: "pipe" });
    console.log(`✓ ${file.src} → ${file.out}`);
  } catch (err) {
    console.error(`✗ Error obfuscating ${file.src}:`, err.message);
  }
}

// Copy non-JS files
console.log("\n📋 Copying non-JS files...\n");
for (const file of COPY_FILES) {
  const srcPath = path.resolve(root, file.src);
  const outPath = path.resolve(root, file.out);

  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  Skip (not found): ${file.src}`);
    continue;
  }

  try {
    fs.copyFileSync(srcPath, outPath);
    console.log(`✓ ${file.src} → ${file.out}`);
  } catch (err) {
    console.error(`✗ Error copying ${file.src}:`, err.message);
  }
}

console.log("\n✅ Done! Extension files obfuscated successfully.");
