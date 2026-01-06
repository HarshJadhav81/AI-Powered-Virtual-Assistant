import React from 'react';

const AssistantStatus = ({ isAssistantActive, assistantName }) => {
    return (
        <div className='absolute top-[65px] left-[20px] flex items-center gap-[10px] bg-[#00000080] backdrop-blur-md px-[15px] py-[8px] rounded-full z-50'>
            <div className={`w-[10px] h-[10px] rounded-full ${isAssistantActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className={`text-[14px] font-medium ${isAssistantActive ? 'text-green-300' : 'text-gray-300'}`}>
                {isAssistantActive ? `${assistantName} Active` : `Say "${assistantName}"`}
            </span>
        </div>
    );
};

export default AssistantStatus;
