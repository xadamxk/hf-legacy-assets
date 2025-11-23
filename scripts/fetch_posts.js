#!/usr/bin/env node
/**
 * Fetch contiguous first-author posts for HF News editions and save to news/editions/<edition>/posts.json
 *
 * Usage:
 *   node scripts/fetch_posts.js --start <StartEditionNumber> --end <EndEditionNumber> --token <APIToken>
 *
 * Notes:
 * - Reads editions and links from news/editions.csv
 * - Skips editions without a link or without a tid in the link and logs "Edition <n> - no tid found"
 * - Skips editions that already have news/<edition>/posts.json
 * - For each fetched thread, selects the first post's author (uid) and includes only the contiguous posts
 *   from the same author starting at the first post until a different uid appears.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

class RateLimitError extends Error {
  constructor(message) {
    super(message || "MAX_HOURLY_CALLS_EXCEEDED");
    this.name = "RateLimitError";
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const part = argv[i];
    if (part.startsWith("--")) {
      const [key, value] = part.split("=");
      const k = key.replace(/^--/, "");
      if (value !== undefined) {
        args[k] = value;
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) {
          args[k] = next;
          i++;
        } else {
          args[k] = true;
        }
      }
    }
  }
  return args;
}

/**
 * Minimal CSV parser for grabbing first N fields, respecting quotes and commas inside quotes.
 * Returns array of fields (length <= fieldsToExtract). Missing fields are returned as empty strings.
 */
function parseCsvLineFirstN(line, fieldsToExtract) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
      if (fields.length === fieldsToExtract) {
        // We can stop early; we don't need to parse the rest of the line fully
        break;
      }
    } else {
      current += ch;
    }
  }
  if (fields.length < fieldsToExtract) {
    fields.push(current);
  }
  // Ensure at most fieldsToExtract items
  return fields.slice(0, fieldsToExtract).map((s) => s.trim());
}

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  // Expect header at line 0: Edition,Link,Name,Note
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const [edition, link] = parseCsvLineFirstN(lines[i], 2);
    rows.push({ edition, link });
  }
  return rows;
}

function extractTidFromLink(link) {
  try {
    if (!link) return null;
    const u = new URL(link);
    const tid = u.searchParams.get("tid");
    if (!tid) return null;
    if (!/^\d+$/.test(tid)) return null;
    return tid;
  } catch {
    return null;
  }
}

function postJson({ url, headers, body }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(headers || {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(data || "{}");
              resolve(json);
            } catch (e) {
              reject(new Error(`Failed to parse JSON response: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data || "<no body>"}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(JSON.stringify(body || {}));
    req.end();
  });
}

function selectContiguousFirstAuthorPosts(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return [];
  const firstUid = posts[0].uid;
  const result = [];
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    if (p.uid === firstUid) {
      result.push(p);
    } else {
      break;
    }
  }
  return result;
}

async function fetchThreadPosts({ tid, token }) {
  const url = "https://hackforums.net/api/v2/read/posts";
  const headers = {
    Authorization: `Bearer ${token}`,
    "Access-Token": token,
    "Content-Type": "application/json",
    // Cookie: "mybb[lastactive]=1763917638; mybb[lastvisit]=1763915752",
    "User-Agent": "PostmanRuntime/7.50.0",
  };
  const body = {
    asks: {
      posts: {
        _tid: [tid],
        pid: true,
        uid: true,
        dateline: true,
        message: true,
        subject: true,
      },
    },
  };
  const response = await postJson({ url, headers, body });
  // Expect response.posts = [...]
  if (
    response &&
    response.success === false &&
    response.message === "MAX_HOURLY_CALLS_EXCEEDED"
  ) {
    throw new RateLimitError(response.message);
  }
  if (!response || !Array.isArray(response.posts)) {
    throw new Error("Unexpected API response shape (missing posts array)");
  }
  return response.posts;
}

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const start = args.start || args.s;
  const end = args.end || args.e;
  const token = args.token || args.t;

  if (!start || !end || !token) {
    console.error(
      "Usage: node scripts/fetch_posts.js --start <StartEditionNumber> --end <EndEditionNumber> --token <APIToken>"
    );
    process.exit(1);
  }

  const startNum = Number(start);
  const endNum = Number(end);
  if (!Number.isFinite(startNum) || !Number.isFinite(endNum)) {
    console.error("Start and End must be numeric");
    process.exit(1);
  }
  if (endNum < startNum) {
    console.error("End must be >= Start");
    process.exit(1);
  }

  const editionsCsvPath = path.join(process.cwd(), "news", "editions.csv");
  if (!fs.existsSync(editionsCsvPath)) {
    console.error(`Cannot find ${editionsCsvPath}`);
    process.exit(1);
  }

  const rows = readCsv(editionsCsvPath);
  // Build a map from edition (as string) to link for quick lookup
  const editionToLink = new Map();
  for (const row of rows) {
    if (!row || row.edition === undefined) continue;
    editionToLink.set(String(row.edition), row.link || "");
  }

  for (let ed = startNum; ed <= endNum; ed++) {
    const editionKey = String(ed);
    const link = editionToLink.get(editionKey) || "";
    const tid = extractTidFromLink(link);
    const editionDir = path.join(process.cwd(), "news", "editions", editionKey);
    const postsFile = path.join(editionDir, "posts.json");

    if (!tid) {
      console.log(`Edition ${editionKey} - no tid found`);
      continue;
    }

    if (fileExists(postsFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(postsFile, "utf8"));
        if (
          existing &&
          Array.isArray(existing.posts) &&
          existing.posts.length > 0
        ) {
          console.log(`Edition ${editionKey} - posts.json exists, skipping`);
          continue;
        }
      } catch {
        // If unreadable or invalid, we'll attempt to re-fetch and overwrite
      }
    }

    try {
      const posts = await fetchThreadPosts({ tid, token });
      const contiguous = selectContiguousFirstAuthorPosts(posts);
      ensureDirSync(editionDir);
      const payload = { posts: contiguous };
      fs.writeFileSync(postsFile, JSON.stringify(payload, null, 2), "utf8");
      console.log(
        `Edition ${editionKey} - fetched ${contiguous.length} post(s)`
      );
    } catch (err) {
      if (
        err &&
        (err.name === "RateLimitError" ||
          String(err.message).includes("MAX_HOURLY_CALLS_EXCEEDED"))
      ) {
        console.log(`Rate limit reached: MAX_HOURLY_CALLS_EXCEEDED. Stopping.`);
        process.exit(1);
      }
      console.log(`Edition ${editionKey} - fetch failed: ${err.message}`);
    }
  }
}

if (require.main === module) {
  main();
}
