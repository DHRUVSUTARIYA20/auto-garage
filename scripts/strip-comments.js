import fs from "fs/promises";
import path from "path";
import strip from "strip-comments";

const ROOT = path.resolve(process.cwd());
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage"]);
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".md"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      files.push(...(await walk(path.join(dir, ent.name))));
    } else if (ent.isFile()) {
      files.push(path.join(dir, ent.name));
    }
  }
  return files;
}

function removeJsxComments(content) {
  
  return content.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

function removeHtmlComments(content) {
  return content.replace(/<!--([\s\S]*?)-->/g, "");
}

async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTENSIONS.has(ext)) return false;
  let content = await fs.readFile(filePath, "utf8");
  const original = content;

  try {
    if (ext === ".html" || ext === ".md") {
      content = removeHtmlComments(content);
    }

    if (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx") {
      content = removeJsxComments(content);
      content = strip(content);
    }

    if (ext === ".css") {
      
      content = strip.block(content);
    }

    
    content = content.split("\n").map(line => line.replace(/[ \t]+$/g, "")).join("\n");

    if (content !== original) {
      
      await fs.copyFile(filePath, filePath + ".bak-comments");
      await fs.writeFile(filePath, content, "utf8");
      console.log("Stripped comments:", filePath);
      return true;
    }
  } catch (err) {
    console.error("Failed to process", filePath, err);
  }
  return false;
}

async function main() {
  console.log("Scanning files...");
  const allFiles = await walk(ROOT);
  let changed = 0;
  for (const f of allFiles) {
    const res = await processFile(f);
    if (res) changed++;
  }
  console.log(`Done. Files changed: ${changed}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
