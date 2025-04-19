import TurndownService from "turndown";

function cleanAttribute(attribute?: string | null) {
  return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
}

const turndownService = new TurndownService();

turndownService.remove(["script", "style", "img", "iframe"]);

turndownService.addRule("a-tag", {
  filter: function (node, options) {
    return !!(
      options.linkStyle === "inlined" &&
      node.nodeName === "A" &&
      node.getAttribute("href")
    );
  },

  replacement: function (content, node) {
    const tag = node as HTMLAnchorElement;
    const href = tag.getAttribute("href");
    let title = cleanAttribute(tag.getAttribute("title"));
    if (title) title = ' "' + title + '"';
    return "[" + content.replace(/\n/g, "") + "](" + href + title + ")";
  },
});

export { turndownService };
