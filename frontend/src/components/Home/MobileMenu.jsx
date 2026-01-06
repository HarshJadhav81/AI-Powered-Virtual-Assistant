import React from 'react';
import { RxCross1 } from "react-icons/rx";

const MobileMenu = ({ ham, setHam, handleLogOut, navigate, userData }) => {
    return (
        <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform z-[60]`}>
            <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(false)} />
            <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
            <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={() => navigate("/customize")}>Customize your Assistant</button>
            <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={() => navigate("/settings")}>⚙️ Settings</button>

            <div className='w-full h-[2px] bg-gray-400'></div>
            <h1 className='text-white font-semibold text-[19px]'>History</h1>

            <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
                {userData.history?.map((his, index) => (
                    <div key={index} className='text-gray-200 text-[18px] w-full h-[30px]  '>{his}</div>
                ))}
            </div>
        </div>
    );
};

export default MobileMenu;
