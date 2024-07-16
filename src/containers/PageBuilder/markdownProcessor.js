import { createElement, Fragment } from "react";
import rehypeReact from "rehype-react";
// If you need to support HTML tags, remember to sanitize the output
// https://github.com/remarkjs/remark-rehype#example-supporting-html-in-markdown-properly
import rehypeSanitize from "rehype-sanitize";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
// cjs module
import { default as unified } from "unified";

const processor = (components = {}) => {
	return unified().use(remarkParse).use(remark2rehype).use(rehypeSanitize).use(rehypeReact, {
		createElement,
		Fragment,
		components,
	});
};

const renderMarkdown = (markdownText, components) => {
	return processor(components).processSync(markdownText).result;
};
export default renderMarkdown;
