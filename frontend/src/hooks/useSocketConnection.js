import { useEffect, useState, useRef } from 'react';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

export const useSocketConnection = () => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        console.info('[COPILOT-UPGRADE]', 'Initializing Socket.io connection');
        socketService.connect();

        // Initial check
        setIsConnected(socketService.isConnected());
        socketRef.current = socketService.getSocket();

        const onConnect = () => {
            setIsConnected(true);
            socketRef.current = socketService.getSocket();
            toast.success('Connected to server');
        };

        const onDisconnect = () => {
            setIsConnected(false);
            toast.error('Disconnected from server');
        };

        socketService.on('connect', onConnect);
        socketService.on('disconnect', onDisconnect);

        return () => {
            socketService.disconnect();
        };
    }, []);

    return { isConnected, socketRef };
};
