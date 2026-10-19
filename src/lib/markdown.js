import { marked } from "marked";
import hljs from "highlight.js";

// Custom dotenv / env grammar for highlight.js to accurately highlight .env configuration files
function hljsEnv(hljsInstance) {
  return {
    name: "dotenv",
    aliases: ["env", "dotenv"],
    case_insensitive: false,
    contains: [
      hljsInstance.HASH_COMMENT_MODE,
      {
        className: "attr",
        begin: /^\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_.-]*(?=\s*=)/,
        starts: {
          end: /$/,
          contains: [
            hljsInstance.HASH_COMMENT_MODE,
            hljsInstance.APOS_STRING_MODE,
            hljsInstance.QUOTE_STRING_MODE,
            {
              className: "number",
              begin: /\b\d+(\.\d+)?\b/,
            },
            {
              className: "literal",
              begin: /\b(true|false|yes|no|on|off)\b/i,
            },
            {
              className: "variable",
              begin: /\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/,
            },
          ],
        },
      },
    ],
  };
}

if (!hljs.getLanguage("env")) {
  hljs.registerLanguage("env", hljsEnv);
  hljs.registerLanguage("dotenv", hljsEnv);
}

const LANG_ALIASES = {
  shell: "bash",
  zsh: "bash",
  golang: "go",
  yml: "yaml",
};

// Custom code block renderer with highlight.js syntax highlighting
const renderer = {
  code({ text, lang }) {
    const rawLang = typeof lang === "string" ? lang.trim().toLowerCase() : "";
    const resolvedLang = rawLang ? (LANG_ALIASES[rawLang] || rawLang) : null;
    const validLanguage = resolvedLang && hljs.getLanguage(resolvedLang) ? resolvedLang : null;
    let highlighted = "";
    try {
      highlighted = validLanguage
        ? hljs.highlight(text, { language: validLanguage }).value
        : hljs.highlightAuto(text).value;
    } catch {
      highlighted = text;
    }
    const langClass = validLanguage ? ` class="hljs language-${validLanguage}"` : ' class="hljs"';
    return `<pre><code${langClass}>${highlighted}</code></pre>`;
  },
};

marked.use({ renderer, gfm: true, breaks: false });

export function renderMarkdown(content) {
  if (!content || typeof content !== "string") return "";
  return marked.parse(content);
}

export { marked, hljs };
export default renderMarkdown;
