import React from 'react';

const SourceCitations = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="source-citations mt-4 border-t border-white/10 pt-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Sources</h4>
            <div className="flex flex-wrap gap-2">
                {sources.map((source, index) => (
                    <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-chip text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full border border-white/10 transition-colors flex items-center gap-2 max-w-full truncate"
                    >
                        <span className="font-mono text-blue-400">{index + 1}</span>
                        <span className="truncate max-w-[150px]">{source.title}</span>
                        <span className="text-gray-500 text-[10px] ml-1">({source.source})</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default SourceCitations;
