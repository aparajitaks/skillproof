/**
 * githubService.js
 *
 * Fetches real code context from a public GitHub repository.
 * Used to enrich AI evaluations with actual code signals.
 *
 * Security measures:
 * - 8s timeout per request
 * - 20KB total payload cap
 * - Binary/image/font file filtering
 * - File size limit per file (50KB raw)
 * - URL validation (caller's responsibility)
 */
const logger = require("../utils/logger");

const GITHUB_API = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_FILE_SIZE_BYTES = 50_000;   // 50KB raw content per file
const MAX_TOTAL_CHARS = 20_000;       // ~20KB chars total sent to AI
const MAX_CONTENT_PER_FILE = 2_500;   // chars per sampled file

const BINARY_EXTENSIONS = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
    ".pdf", ".zip", ".tar", ".gz", ".woff", ".woff2", ".ttf", ".eot",
    ".mp4", ".mp3", ".mov", ".avi", ".lock", ".min.js", ".min.css",
]);

const PRIORITY_FILES = [
    "package.json", "requirements.txt", "go.mod", "cargo.toml",
    "pyproject.toml", "pom.xml", "build.gradle",
];

const ENTRY_PATTERNS = [
    /^(main|app|server|index)\.(js|ts|py|go|rb|java)$/i,
    /^src\/(main|app|server|index)\.(js|ts|py|go)$/i,
];

const SOURCE_DIRS = ["src", "lib", "utils", "core", "api", "controllers", "models", "services"];
const SOURCE_EXT = new Set([".js", ".ts", ".py", ".go", ".java", ".rb", ".rs", ".cs"]);

/**
 * Parse owner and repo from a GitHub URL.
 * Returns null if URL is invalid.
 */
const parseGithubUrl = (url) => {
    try {
        const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
        if (!match) return null;
        return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    } catch {
        return null;
    }
};

/**
 * Fetch a GitHub API endpoint with auth headers + timeout.
 */
const ghFetch = async (path) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "SkillProof/3.0",
    };
    if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    try {
        const res = await fetch(`${GITHUB_API}${path}`, { headers, signal: controller.signal });
        if (!res.ok) {
            logger.warn(`[githubService] ${path} → HTTP ${res.status}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        if (err.name === "AbortError") {
            logger.warn(`[githubService] Timeout on ${path}`);
        } else {
            logger.warn(`[githubService] Fetch error on ${path}: ${err.message}`);
        }
        return null;
    } finally {
        clearTimeout(timeout);
    }
};

const hasBinaryExt = (filename) => {
    const lower = filename.toLowerCase();
    for (const ext of BINARY_EXTENSIONS) {
        if (lower.endsWith(ext)) return true;
    }
    return false;
};

const getExt = (filename) => {
    const i = filename.lastIndexOf(".");
    return i >= 0 ? filename.slice(i).toLowerCase() : "";
};

/**
 * Score a file for priority (higher = more important to sample).
 */
const fileScore = (path) => {
    const name = path.split("/").pop().toLowerCase();
    if (PRIORITY_FILES.includes(name)) return 100;
    if (ENTRY_PATTERNS.some((p) => p.test(path))) return 80;
    if (SOURCE_DIRS.some((d) => path.startsWith(d + "/"))) return 40;
    if (SOURCE_EXT.has(getExt(name))) return 10;
    return 0;
};

/**
 * Fetch file content via GitHub contents API.
 * Returns up to MAX_CONTENT_PER_FILE chars.
 */
const fetchFileContent = async (owner, repo, filePath, sizeByte) => {
    if (sizeByte > MAX_FILE_SIZE_BYTES) {
        logger.debug(`[githubService] Skipping large file: ${filePath} (${sizeByte} bytes)`);
        return null;
    }
    const data = await ghFetch(`/repos/${owner}/${repo}/contents/${filePath}`);
    if (!data?.content) return null;
    try {
        const decoded = Buffer.from(data.content, "base64").toString("utf8");
        return decoded.slice(0, MAX_CONTENT_PER_FILE);
    } catch {
        return null;
    }
};

/**
 * Main export — fetches repo context for AI enrichment.
 *
 * Returns null if the repo is inaccessible (private, 404, etc.)
 * so callers can silently fall back to description-only evaluation.
 *
 * @param {string} githubUrl
 * @returns {object|null} { metadata, languages, fileTree, keyFiles, dependencySummary }
 */
const fetchRepoContext = async (githubUrl) => {
    const parsed = parseGithubUrl(githubUrl);
    if (!parsed) {
        logger.warn(`[githubService] Cannot parse URL: ${githubUrl}`);
        return null;
    }
    const { owner, repo } = parsed;
    logger.info(`[githubService] Fetching context for ${owner}/${repo}`);

    // Fetch metadata + languages in parallel
    const [meta, languages, tree] = await Promise.all([
        ghFetch(`/repos/${owner}/${repo}`),
        ghFetch(`/repos/${owner}/${repo}/languages`),
        ghFetch(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`),
    ]);

    if (!meta) {
        logger.warn(`[githubService] Repo not accessible: ${owner}/${repo}`);
        return null;
    }

    const metadata = {
        name: meta.name,
        description: meta.description || "",
        stars: meta.stargazers_count || 0,
        forks: meta.forks_count || 0,
        topics: meta.topics || [],
        defaultBranch: meta.default_branch || "main",
        language: meta.language || "",
        openIssues: meta.open_issues_count || 0,
        hasTests: false, // updated below
    };

    // Language breakdown (top 4)
    const totalBytes = Object.values(languages || {}).reduce((a, b) => a + b, 0) || 1;
    const languageBreakdown = Object.entries(languages || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([lang, bytes]) => `${lang} ${Math.round((bytes / totalBytes) * 100)}%`)
        .join(", ");

    // File tree analysis
    const allFiles = (tree?.tree || []).filter((f) => f.type === "blob" && !hasBinaryExt(f.path));

    // Detect test presence
    const hasTests = allFiles.some((f) => /test|spec|__tests__|cypress/i.test(f.path));
    metadata.hasTests = hasTests;

    // Score and sort files for sampling
    const scored = allFiles
        .map((f) => ({ ...f, score: fileScore(f.path) }))
        .filter((f) => f.score > 0)
        .sort((a, b) => b.score - a.score);

    // Always fetch priority files (package.json etc), then up to 5 source files
    const priorityFiles = scored.filter((f) => f.score >= 80).slice(0, 3);
    const sourceFiles = scored.filter((f) => f.score < 80).slice(0, 5);
    const filesToFetch = [...priorityFiles, ...sourceFiles];

    // Fetch file contents with total char budget
    let totalChars = 0;
    const keyFiles = [];
    for (const file of filesToFetch) {
        if (totalChars >= MAX_TOTAL_CHARS) break;
        const content = await fetchFileContent(owner, repo, file.path, file.size || 0);
        if (content) {
            keyFiles.push({ path: file.path, content });
            totalChars += content.length;
        }
    }

    // Dependency summary from package.json
    let dependencySummary = "";
    const pkgFile = keyFiles.find((f) => f.path === "package.json");
    if (pkgFile) {
        try {
            const pkg = JSON.parse(pkgFile.content);
            const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) })
                .slice(0, 20)
                .join(", ");
            dependencySummary = deps;
        } catch { /* ignore parse errors */ }
    }

    logger.info(`[githubService] Context ready: ${keyFiles.length} files, ${totalChars} chars total, hasTests=${hasTests}`);

    return {
        metadata,
        languageBreakdown,
        fileTreeSize: allFiles.length,
        keyFiles,
        dependencySummary,
        hasTests,
    };
};

module.exports = { fetchRepoContext, parseGithubUrl };
