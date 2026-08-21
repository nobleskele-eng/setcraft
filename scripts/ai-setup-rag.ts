import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI, type Document } from "@google/genai";
import { loadProjectEnv, upsertEnvValue } from "./ai-env";

const APPROVED_STATUSES = new Set(["approved", "approved_sample"]);
const SUPPORTED_EXTENSIONS = new Set([".md", ".txt", ".csv", ".pdf"]);

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function flagValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalizeStoreName(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("fileSearchStores/") ? trimmed : `fileSearchStores/${trimmed}`;
}

function walkFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

function reviewStatus(filePath: string) {
  if (path.extname(filePath).toLowerCase() === ".pdf") return "draft";
  const prefix = fs.readFileSync(filePath, "utf8").slice(0, 6000);
  return prefix.match(/^review_status:\s*([a-z_]+)/im)?.[1]?.toLowerCase() || "draft";
}

function workflowFor(relativePath: string) {
  const firstDirectory = relativePath.split(/[\\/]/)[0] || "shared";
  return firstDirectory.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
}

function hashFile(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function metadataValue(document: Document, key: string) {
  return document.customMetadata?.find((item) => item.key === key)?.stringValue;
}

async function findStore(ai: GoogleGenAI, displayName: string, configuredName: string) {
  if (configuredName) {
    try {
      return await ai.fileSearchStores.get({ name: configuredName });
    } catch {
      console.warn("The configured File Search store was not found; LaneLab will create or reuse one by display name.");
    }
  }

  const stores = await ai.fileSearchStores.list({ config: { pageSize: 100 } });
  for await (const store of stores) {
    if (store.displayName === displayName) return store;
  }
  return undefined;
}

async function waitForUpload(ai: GoogleGenAI, initialOperation: Awaited<ReturnType<GoogleGenAI["fileSearchStores"]["uploadToFileSearchStore"]>>) {
  let operation = initialOperation;
  const deadline = Date.now() + 5 * 60 * 1000;
  while (!operation.done) {
    if (Date.now() > deadline) throw new Error("Knowledge indexing timed out after five minutes.");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    operation = await ai.operations.get({ operation }) as typeof operation;
  }
  if (operation.error) throw new Error(`Knowledge indexing failed: ${JSON.stringify(operation.error)}`);
}

async function main() {
  const root = process.cwd();
  loadProjectEnv(root);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to .env or .env.local, then run this command again.");
  }

  const knowledgeRoot = path.join(root, "ai", "knowledge");
  const allFiles = walkFiles(knowledgeRoot);
  const approvedFiles = allFiles.filter((filePath) => APPROVED_STATUSES.has(reviewStatus(filePath)));
  const draftFiles = allFiles.filter((filePath) => !APPROVED_STATUSES.has(reviewStatus(filePath)));
  if (!approvedFiles.length) {
    throw new Error("No approved knowledge files were found. Review a template and set review_status: approved before uploading it.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const displayName = flagValue("--store-name") || process.env.LANELAB_RAG_STORE_NAME || "LaneLab Coaching Knowledge";
  const configuredName = normalizeStoreName(process.env.GEMINI_FILE_SEARCH_STORE);
  let store = await findStore(ai, displayName, configuredName);

  if (hasFlag("--reset") && store?.name) {
    await ai.fileSearchStores.delete({ name: store.name, config: { force: true } });
    store = undefined;
  }

  if (!store) {
    store = await ai.fileSearchStores.create({
      config: { displayName, embeddingModel: "models/gemini-embedding-2" },
    });
  }
  if (!store.name) throw new Error("Gemini did not return a File Search store name.");

  const remoteDocuments = new Map<string, Document>();
  const documents = await ai.fileSearchStores.documents.list({ parent: store.name, config: { pageSize: 100 } });
  for await (const document of documents) {
    if (document.displayName) remoteDocuments.set(document.displayName, document);
  }

  let uploaded = 0;
  let replaced = 0;
  let unchanged = 0;
  const managedNames = new Set<string>();

  for (const filePath of approvedFiles.sort()) {
    const relativePath = path.relative(knowledgeRoot, filePath).replace(/\\/g, "/");
    const displayNameForFile = `lanelab/${relativePath}`;
    const sha256 = hashFile(filePath);
    managedNames.add(displayNameForFile);
    const existing = remoteDocuments.get(displayNameForFile);

    if (existing && metadataValue(existing, "lanelab_sha256") === sha256) {
      unchanged += 1;
      continue;
    }
    if (existing?.name) {
      await ai.fileSearchStores.documents.delete({ name: existing.name, config: { force: true } });
      replaced += 1;
    }

    const operation = await ai.fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName: store.name,
      file: filePath,
      config: {
        displayName: displayNameForFile,
        customMetadata: [
          { key: "managed_by", stringValue: "lanelab" },
          { key: "workflow", stringValue: workflowFor(relativePath) },
          { key: "review_status", stringValue: reviewStatus(filePath) },
          { key: "lanelab_sha256", stringValue: sha256 },
        ],
        chunkingConfig: {
          whiteSpaceConfig: { maxTokensPerChunk: 500, maxOverlapTokens: 75 },
        },
      },
    });
    await waitForUpload(ai, operation);
    uploaded += 1;
  }

  if (hasFlag("--prune")) {
    for (const document of remoteDocuments.values()) {
      if (metadataValue(document, "managed_by") !== "lanelab") continue;
      if (!document.displayName || managedNames.has(document.displayName) || !document.name) continue;
      await ai.fileSearchStores.documents.delete({ name: document.name, config: { force: true } });
    }
  }

  if (hasFlag("--write-env")) {
    const requestedEnvFile = flagValue("--env-file");
    const envFile = requestedEnvFile
      ? path.resolve(root, requestedEnvFile)
      : fs.existsSync(path.join(root, ".env"))
        ? path.join(root, ".env")
        : path.join(root, ".env.local");
    upsertEnvValue(envFile, "GEMINI_FILE_SEARCH_STORE", store.name);
    console.log(`Saved the File Search store setting to ${path.basename(envFile)}.`);
  } else {
    console.log(`Add this line to .env: GEMINI_FILE_SEARCH_STORE=${store.name}`);
  }

  console.log(`Knowledge ready: ${uploaded} uploaded, ${replaced} replaced, ${unchanged} unchanged, ${draftFiles.length} draft file(s) skipped.`);
  console.log("Restart npm run dev so the website loads the File Search setting.");
}

main().catch((error) => {
  console.error(`LaneLab knowledge setup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
