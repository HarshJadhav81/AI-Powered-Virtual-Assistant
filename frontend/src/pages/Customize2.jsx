import React, { useContext, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import axios from 'axios'
import { MdKeyboardBackspace } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // Add toast for error handling

function Customize2() {
    const {userData, backendImage, selectedImage, serverUrl, setUserData} = useContext(userDataContext)
    const [assistantName, setAssistantName] = useState(userData?.AssistantName || "")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleUpdateAssistant = async () => {
        if (!assistantName.trim()) {
            toast.error("Assistant name is required");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("assistantName", assistantName.trim());
            
            if (backendImage) {
                formData.append("assistantImage", backendImage);
            } else if (selectedImage) {
                formData.append("imageUrl", selectedImage);
            }

            const response = await axios.put(`${serverUrl}/api/user/update`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data.success) {
                setUserData(response.data.user);
                toast.success(response.data.message);
                navigate("/");
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || "Failed to update assistant");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#030353] flex justify-center items-center flex-col p-[20px] relative'>
            <MdKeyboardBackspace 
                className='absolute top-[30px] left-[30px] text-white cursor-pointer w-[25px] h-[25px]' 
                onClick={() => navigate("/customize")}
            />
            <h1 className='text-white mb-[40px] text-[30px] text-center'>
                Enter Your <span className='text-blue-200'>Assistant Name</span>
            </h1>
            <input 
                type="text" 
                placeholder='eg. shifra' 
                className='w-full max-w-[600px] h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]' 
                required 
                onChange={(e) => setAssistantName(e.target.value)} 
                value={assistantName}
            />
            <button 
                className={`min-w-[300px] h-[60px] mt-[30px] text-black font-semibold cursor-pointer bg-white rounded-full text-[19px] ${loading ? 'opacity-70' : ''}`} 
                disabled={loading || !assistantName.trim()} 
                onClick={handleUpdateAssistant}
            >
                {loading ? "Updating..." : "Finally Create Your Assistant"}
            </button>
        </div>
    )
}

export default Customize2