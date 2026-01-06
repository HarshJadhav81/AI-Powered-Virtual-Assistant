import { useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const useGreeting = (userData, speak) => {
    const hasGreeted = useRef(false);
    const speechInitialized = useRef(false);
    const synth = window.speechSynthesis;

    useEffect(() => {
        if (!userData || hasGreeted.current) return;

        hasGreeted.current = true;

        const enableSpeechAndGreet = () => {
            if (!speechInitialized.current) {
                speechInitialized.current = true;

                // Mobile browsers require user interaction to unlock audio
                const testUtterance = new SpeechSynthesisUtterance('');
                testUtterance.volume = 0;
                synth.speak(testUtterance);

                setTimeout(() => {
                    speak(`Hello ${userData.name}, I'm ${userData.assistantName}. How can I help you today?`);
                }, 500);

                document.removeEventListener('click', enableSpeechAndGreet);
                document.removeEventListener('keydown', enableSpeechAndGreet);
            }
        };

        // Auto-attempt after 1s, but wait for interaction if blocked
        setTimeout(() => {
            if (!speechInitialized.current) {
                console.log('[SPEECH] Waiting for user interaction to enable speech');
                document.addEventListener('click', enableSpeechAndGreet, { once: true });
                document.addEventListener('keydown', enableSpeechAndGreet, { once: true });
                toast('Click anywhere to enable voice assistant', { duration: 5000 });
            }
        }, 1000);

        return () => {
            document.removeEventListener('click', enableSpeechAndGreet);
            document.removeEventListener('keydown', enableSpeechAndGreet);
        }
    }, [userData, speak, synth]);
};
