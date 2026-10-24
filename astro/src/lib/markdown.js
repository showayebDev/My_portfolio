import { marked } from "marked";
import hljs from "highlight.js";
import sanitizeHtml from "sanitize-html";

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

const SANITIZE_OPTIONS = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "span",
    "h1",
    "h2",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "del",
    "s",
    "strike",
    "sub",
    "sup",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "title", "class", "width", "height", "loading"],
    code: ["class"],
    span: ["class"],
    pre: ["class"],
    th: ["align"],
    td: ["align"],
  },
  allowedClasses: {
    "*": ["hljs*", "language-*"],
  },
};

export function renderMarkdown(content) {
  if (!content || typeof content !== "string") return "";
  const rawHtml = marked.parse(content);
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}

export default renderMarkdown;

