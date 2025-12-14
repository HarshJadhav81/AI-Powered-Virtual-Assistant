import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/vs2015.css'; // Dark theme for code
import './MarkdownRenderer.css';

/**
 * MarkdownRenderer - Professional markdown rendering for Orvion
 * Supports: headings, tables, bullets, emojis, code blocks, horizontal lines
 */
const MarkdownRenderer = ({ content }) => {
    // Ensure content is a string (fix [object Object] bug)
    const textContent = typeof content === 'string'
        ? content
        : content?.content ?? JSON.stringify(content, null, 2);

    return (
        <div className="orvion-markdown-wrapper orvion-markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    h1: ({ node, ...props }) => <h1 {...props} />,
                    h2: ({ node, ...props }) => <h2 {...props} />,
                    h3: ({ node, ...props }) => <h3 {...props} />,
                    h4: ({ node, ...props }) => <h4 {...props} />,
                    p: ({ node, ...props }) => <p {...props} />,
                    ul: ({ node, ...props }) => <ul {...props} />,
                    ol: ({ node, ...props }) => <ol {...props} />,
                    li: ({ node, ...props }) => <li {...props} />,
                    table: ({ node, ...props }) => <table {...props} />,
                    thead: ({ node, ...props }) => <thead {...props} />,
                    tbody: ({ node, ...props }) => <tbody {...props} />,
                    tr: ({ node, ...props }) => <tr {...props} />,
                    th: ({ node, ...props }) => <th {...props} />,
                    td: ({ node, ...props }) => <td {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote {...props} />,
                    a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
                    code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <pre className={className}>
                                <code className={match[1]} {...props}>
                                    {children}
                                </code>
                            </pre>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {textContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
