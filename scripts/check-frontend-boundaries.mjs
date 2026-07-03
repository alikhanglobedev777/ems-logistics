import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const workspaceRoot = process.cwd().endsWith(`${sep}apps${sep}web`)
  ? join(process.cwd(), "..", "..")
  : process.cwd();

const featuresDir = join(workspaceRoot, "apps", "web", "src", "features");

const violations = [];

function walk(dir) {
  if (!existsSync(dir)) {
    violations.push(`Features directory not found: ${dir}`);
    return;
  }

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry)) {
      continue;
    }

    checkFile(fullPath);
  }
}

function normalizePath(filePath) {
  return relative(workspaceRoot, filePath).split(sep).join("/");
}

function isFeatureApiWrapper(normalizedPath) {
  return /^apps\/web\/src\/features\/[^/]+\/api\/.+\.api\.ts$/.test(normalizedPath);
}

function checkFile(filePath) {
  const normalizedPath = normalizePath(filePath);
  const source = readFileSync(filePath, "utf8");

  const importsApiClient = source.includes("from '@ems/api-client'") || source.includes('from "@ems/api-client"');
  const usesDirectFetch = /\bfetch\s*\(/.test(source);
  const usesAxios = /from ['"]axios['"]|require\(['"]axios['"]\)/.test(source);

  if (importsApiClient && !isFeatureApiWrapper(normalizedPath)) {
    violations.push(
      `${normalizedPath}: Only feature api wrappers may import hooks/types from @ems/api-client. UI/pages/routes must import from their own feature api wrapper.`,
    );
  }

  if (usesDirectFetch) {
    violations.push(`${normalizedPath}: Do not use direct fetch in feature code. Use Orval generated API hooks through the feature api wrapper.`);
  }

  if (usesAxios) {
    violations.push(`${normalizedPath}: Do not use axios directly in feature code. Use Orval generated API hooks through the feature api wrapper.`);
  }
}

walk(featuresDir);

if (violations.length > 0) {
  console.error("Frontend boundary check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Frontend boundary check passed.");
