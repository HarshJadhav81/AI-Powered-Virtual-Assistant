import React from 'react';

const ConnectionStatus = ({ isConnected }) => {
    return (
        <div className='absolute top-[20px] left-[20px] flex items-center gap-[10px] bg-[#00000080] backdrop-blur-md px-[15px] py-[8px] rounded-full z-50'>
            <div className={`w-[10px] h-[10px] rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className='text-white text-[14px] font-medium'>
                {isConnected ? 'Connected' : 'Offline'}
            </span>
        </div>
    );
};

export default ConnectionStatus;
