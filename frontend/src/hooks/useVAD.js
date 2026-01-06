import { useEffect, useState, useRef } from 'react';
import vadService from '../services/vadService';
import toast from 'react-hot-toast';

export const useVAD = (isSpeakingRef, onSpeechStart) => {
    const synth = window.speechSynthesis;

    useEffect(() => {
        vadService.initialize().then(() => {
            console.info('[VAD] Service initialized');

            vadService.on('speechStart', () => {
                if (isSpeakingRef.current) {
                    // Check audio level to distinguish user voice from echo
                    const level = vadService.getAudioLevel();
                    // Only interrupt if level is significant
                    if (level > 0.2) {
                        synth.cancel();
                        if (onSpeechStart) onSpeechStart();

                        console.info('[VAD] TTS interrupted by user (Level:', level.toFixed(3), ')');
                        toast('Listening...', { icon: '👂' });
                    } else {
                        console.debug('[VAD] Ignored low volume speech/echo (Level:', level.toFixed(3), ')');
                    }
                }
            });

            vadService.startMonitoring();
        }).catch(err => console.warn('[VAD] Init failed:', err));

        return () => {
            // Optional: Stop monitoring on unmount if you want strict cleanup
            // But valid to keep running if global. Let's act safe and stop.
            vadService.stopMonitoring();
        };

    }, [isSpeakingRef, onSpeechStart, synth]);

    // Removed audioLevel return to prevent parent re-renders
};
