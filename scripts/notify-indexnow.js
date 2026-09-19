// Tells IndexNow (Bing, Yandex, Seznam, Naver) which URLs this site publishes.
//
// Why this site needs it: nothing here has ever been announced to a search
// engine, and the only discovery path the site has is the sibling footer.
// IndexNow is the one channel that does not wait for a crawler to come looking
// -- the site pushes. The key is *meant* to be public, which is why it is
// committed next to this file and served at the site root.
//
// The URL list comes from `sitemap.xml at the repo root`, the same file the crawlers read.
// This repo has no build step and GitHub Pages
// serves it verbatim, so what is committed is what is published.
//
// Usage:
//   node scripts/notify-indexnow.js --dry-run   # parse and report, submit nothing
//   node scripts/notify-indexnow.js             # submit
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export const HOST = "worthit.geeknite.com";
export const KEY = "2d79f447-d919-4055-90ea-af54c6f0dd30";
export const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 100;
const DELAY_MS = 3000;

const SITEMAP = join(ROOT, "sitemap.xml");
const KEY_FILE = join(ROOT, `${KEY}.txt`);

const XML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

export function decodeXmlEntities(text) {
  return text.replace(/&(amp|lt|gt|quot|apos);/g, (entity) => XML_ENTITIES[entity]);
}

export function extractLocs(xml) {
  const locs = [];
  const pattern = /<loc>\s*([^<]+?)\s*<\/loc>/g;
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    locs.push(decodeXmlEntities(match[1]));
  }
  return locs;
}

// IndexNow answers 422 for a list that mixes hosts, and rejects the whole batch
// rather than the stray URL, so the filter is not cosmetic. Duplicates are
// dropped for the same reason a batch is capped: the quota is per URL.
export function selectOwnUrls(locs, host) {
  const seen = new Set();
  const urls = [];
  for (const loc of locs) {
    let parsed;
    try {
      parsed = new URL(loc);
    } catch {
      continue;
    }
    if (parsed.host !== host) continue;
    if (seen.has(parsed.href)) continue;
    seen.add(parsed.href);
    urls.push(parsed.href);
  }
  return urls;
}

export function loadUrls() {
  let xml;
  try {
    xml = readFileSync(SITEMAP, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`No sitemap at ${SITEMAP}.`);
    throw error;
  }
  return { path: SITEMAP, urls: selectOwnUrls(extractLocs(xml), HOST) };
}

// The sibling repos assert this in a unit test. There is no test runner here --
// this repo is plain HTML and has no package.json -- so the check runs before
// every submission instead. It earns its place either way: a renamed or deleted
// key file turns every submission into a 403 and changes nothing else visible,
// and this message names the file, which a 403 does not.
export function checkKeyFile() {
  let contents;
  try {
    contents = readFileSync(KEY_FILE, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `${KEY_FILE} is missing. IndexNow fetches it from ${KEY_LOCATION} to authenticate, so without it every submission answers 403.`,
      );
    }
    throw error;
  }
  if (contents.trim() !== KEY) {
    throw new Error(`${KEY_FILE} does not hold the key this script submits (${KEY}).`);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The status codes are the API's own and each one means something different
// about what to fix; collapsing them into "failed" is how a broken key survives
// for weeks. 403 in particular is not about the URLs: it means the endpoint
// could not read the key at KEY_LOCATION.
function describeStatus(status) {
  switch (status) {
    case 400:
      return "bad request -- the JSON body or the key format is wrong";
    case 403:
      return `key not valid -- ${KEY_LOCATION} did not answer with the key`;
    case 422:
      return "unprocessable -- a URL does not belong to the host, or the key does not match";
    case 429:
      return "too many requests -- submitting less often is the fix";
    default:
      return "unexpected status";
  }
}

async function submit(urls) {
  let submitted = 0;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      }),
    });

    if (!response.ok && response.status !== 202) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `IndexNow refused ${batch.length} URLs with ${response.status}: ${describeStatus(response.status)}` +
          (body ? `\n${body}` : ""),
      );
    }

    submitted += batch.length;
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} URLs accepted (${response.status}).`);
    if (i + BATCH_SIZE < urls.length) await sleep(DELAY_MS);
  }
  return submitted;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  checkKeyFile();
  const { path, urls } = loadUrls();
  console.log(`${urls.length} URLs for ${HOST} from ${path}`);
  if (urls.length === 0) {
    throw new Error("The sitemap yielded no URL for this host. Nothing would be submitted.");
  }

  if (dryRun) {
    for (const url of urls.slice(0, 5)) console.log(`  ${url}`);
    if (urls.length > 5) console.log(`  ... and ${urls.length - 5} more`);
    console.log(`Dry run: nothing submitted. Key would be read from ${KEY_LOCATION}`);
    return;
  }

  const submitted = await submit(urls);
  console.log(`Done. ${submitted}/${urls.length} URLs submitted to IndexNow.`);
}

// Only when run directly, so the parsing can be imported without posting. Both
// sides go through realpath because `E:\Repository\geeknite` is a junction to
// `F:\dev\geeknite`: reached through it, the two spellings of the same file
// compare unequal and the script would exit silently having done nothing, which
// is indistinguishable from a successful run.
function isDirectRun() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
