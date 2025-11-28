import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

/**
 * Markdown Renderer Component
 * Renders markdown with code syntax highlighting
 * OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
const MarkdownRenderer = React.memo(({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                },
                // Style links
                a({ node, children, ...props }) {
                    return (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            {children}
                        </a>
                    );
                },
                // Style lists
                ul({ node, children, ...props }) {
                    return (
                        <ul className="list-disc list-inside my-2 space-y-1" {...props}>
                            {children}
                        </ul>
                    );
                },
                ol({ node, children, ...props }) {
                    return (
                        <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
                            {children}
                        </ol>
                    );
                },
                // Style paragraphs
                p({ node, children, ...props }) {
                    return (
                        <p className="my-2 leading-relaxed" {...props}>
                            {children}
                        </p>
                    );
                },
                // Style headings
                h1({ node, children, ...props }) {
                    return (
                        <h1 className="text-2xl font-bold my-3" {...props}>
                            {children}
                        </h1>
                    );
                },
                h2({ node, children, ...props }) {
                    return (
                        <h2 className="text-xl font-bold my-2" {...props}>
                            {children}
                        </h2>
                    );
                },
                h3({ node, children, ...props }) {
                    return (
                        <h3 className="text-lg font-semibold my-2" {...props}>
                            {children}
                        </h3>
                    );
                },
                // Style blockquotes
                blockquote({ node, children, ...props }) {
                    return (
                        <blockquote
                            className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-700"
                            {...props}
                        >
                            {children}
                        </blockquote>
                    );
                },
                // Style tables
                table({ node, children, ...props }) {
                    return (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-gray-300" {...props}>
                                {children}
                            </table>
                        </div>
                    );
                },
                th({ node, children, ...props }) {
                    return (
                        <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold" {...props}>
                            {children}
                        </th>
                    );
                },
                td({ node, children, ...props }) {
                    return (
                        <td className="border border-gray-300 px-4 py-2" {...props}>
                            {children}
                        </td>
                    );
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;

