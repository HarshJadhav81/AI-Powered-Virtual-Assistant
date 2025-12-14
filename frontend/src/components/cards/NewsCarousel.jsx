import React from 'react';
import { FiExternalLink } from 'react-icons/fi';

const NewsCarousel = ({ articles }) => {
    if (!articles || articles.length === 0) return null;

    return (
        <div className="news-carousel w-full overflow-x-auto pb-4 flex gap-4 my-2 scrollbar-hide">
            {articles.map((article, index) => (
                <div
                    key={index}
                    className="news-card min-w-[280px] max-w-[280px] bg-gray-800/50 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 hover:bg-gray-800/80 transition-colors"
                >
                    {article.urlToImage && (
                        <div className="h-32 w-full overflow-hidden">
                            <img
                                src={article.urlToImage}
                                alt={article.title}
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>
                    )}
                    <div className="p-4">
                        <div className="text-xs text-blue-400 mb-1">{article.source?.name}</div>
                        <h4 className="text-sm font-semibold text-white line-clamp-3 mb-2">
                            {article.title}
                        </h4>
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mt-auto"
                        >
                            Read more <FiExternalLink />
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NewsCarousel;
