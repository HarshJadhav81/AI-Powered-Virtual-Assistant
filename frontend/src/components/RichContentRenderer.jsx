import React from 'react';
import WeatherCard from './cards/WeatherCard';
import NewsCarousel from './cards/NewsCarousel';
import SourceCitations from './cards/SourceCitations';
import WikipediaCard from './cards/WikipediaCard';

const RichContentRenderer = ({ type, data }) => {
    if (!data) return null;

    switch (type) {
        case 'weather-data':
            return <WeatherCard data={data} />;

        case 'news-articles':
            return <NewsCarousel articles={data} />;

        case 'sources':
            return <SourceCitations sources={data} />;

        case 'wikipedia-summary':
            return <WikipediaCard data={data} />;

        case 'device-control':
            return (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                    ✅ {data.message || 'Device command executed'}
                </div>
            );

        default:
            return null;
    }
};

export default RichContentRenderer;
