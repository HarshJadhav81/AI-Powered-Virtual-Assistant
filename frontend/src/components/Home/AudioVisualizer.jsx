import React, { useEffect, useState } from 'react';
import vadService from '../../services/vadService';

const AudioVisualizer = ({ listening }) => {
    const [audioLevel, setAudioLevel] = useState(0);

    useEffect(() => {
        if (!listening) {
            setAudioLevel(0);
            return;
        }

        const handleVolumeChange = (level) => {
            setAudioLevel(level);
        };

        vadService.on('volumeChange', handleVolumeChange);

        return () => {
            vadService.off('volumeChange', handleVolumeChange);
        };
    }, [listening]);

    if (!listening || audioLevel <= 0) return null;

    return (
        <div className='absolute bottom-[150px] left-[50%] transform -translate-x-1/2 flex items-center gap-[4px] z-40'>
            {[...Array(10)].map((_, i) => (
                <div
                    key={i}
                    className='w-[4px] bg-blue-400 rounded-full transition-all duration-100'
                    style={{
                        height: `${Math.max(10, audioLevel * 100 * (0.5 + Math.random() * 0.5))}px`
                    }}
                ></div>
            ))}
        </div>
    );
};

export default AudioVisualizer;
