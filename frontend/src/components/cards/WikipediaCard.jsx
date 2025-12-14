import React, { useState } from 'react';
import './WikipediaCard.css';

const WikipediaCard = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!data) return null;

    const { title, summary, fullContent, url, thumbnail, images, sections } = data;
    const displayImages = images && images.length > 0 ? images : (thumbnail ? [thumbnail] : []);
    const hasMoreContent = fullContent && fullContent.length > summary?.length;

    return (
        <div className="wikipedia-card">
            <div className="wikipedia-header">
                <svg className="wikipedia-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-.93L9.075 5.155c-.26-.545-.479-.932-.659-1.164-.09-.12-.291-.18-.602-.18h-.57L7.199 3.77v-.434l.051-.045s3.904-.005 4.828 0l.051.045v.434c0 .119-.075.18-.225.18l-.39.015c-.33.015-.495.135-.495.359 0 .09.016.181.045.271l2.491 4.876 1.443-2.846c.135-.27.203-.54.203-.811 0-.27-.135-.405-.405-.405l-.421-.015-.051-.045v-.434l.051-.045s2.643-.005 3.568 0l.051.045v.434c0 .119-.075.18-.225.18l-.511.03c-.3.015-.645.27-1.035.765L14.7 9.074l2.052 4.051 2.475-5.012-.18-.391c-.225-.465-.359-.75-.405-.855-.09-.195-.24-.375-.45-.54-.165-.135-.54-.195-1.125-.18l-.045-.045v-.434l.051-.045s4.537-.005 5.461 0l.051.045v.434c0 .119-.075.18-.225.18l-.511.03c-.3.015-.645.27-1.035.765l-4.35 8.64-.045.091c-.195.391-.375.586-.54.586-.165 0-.345-.195-.54-.586l-2.31-4.65-2.564 5.01c-.195.391-.375.586-.54.586-.165 0-.345-.195-.54-.586z" />
                </svg>
                <h3 className="wikipedia-title">{title}</h3>
            </div>

            {/* Image Gallery */}
            {displayImages.length > 0 && (
                <div className="wikipedia-images">
                    {displayImages.length === 1 ? (
                        <div className="wikipedia-single-image">
                            <img src={displayImages[0]} alt={title} />
                        </div>
                    ) : (
                        <div className="wikipedia-image-gallery">
                            {displayImages.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="wikipedia-gallery-item">
                                    <img src={img} alt={`${title} ${idx + 1}`} />
                                </div>
                            ))}
                            {displayImages.length > 4 && (
                                <div className="wikipedia-more-images">
                                    +{displayImages.length - 4} more
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="wikipedia-content">
                {/* Summary */}
                <div className="wikipedia-summary">
                    <p>{summary}</p>
                </div>

                {/* Expandable Full Content */}
                {hasMoreContent && (
                    <>
                        <button
                            className="wikipedia-expand-btn"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? '▼ Show Less' : '▶ Read Full Article'}
                        </button>

                        {isExpanded && (
                            <div className="wikipedia-full-content">
                                <div className="wikipedia-content-text">
                                    {fullContent.split('\n\n').map((paragraph, idx) => (
                                        paragraph.trim() && (
                                            <p key={idx} className="wikipedia-paragraph">
                                                {paragraph}
                                            </p>
                                        )
                                    ))}
                                </div>

                                {/* Article Sections */}
                                {sections && sections.length > 0 && (
                                    <div className="wikipedia-sections">
                                        <h4>Article Sections</h4>
                                        <ul className="wikipedia-section-list">
                                            {sections.map((section, idx) => (
                                                <li
                                                    key={idx}
                                                    className={`wikipedia-section-item level-${section.level}`}
                                                >
                                                    {section.title}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {url && (
                <div className="wikipedia-footer">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wikipedia-link"
                    >
                        Read more on Wikipedia →
                    </a>
                </div>
            )}
        </div>
    );
};

export default WikipediaCard;
