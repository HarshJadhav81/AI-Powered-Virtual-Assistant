import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { userDataContext } from '../context/UserContext';
import axios from 'axios';
import { MdKeyboardBackspace } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function Customize2() {
    const { userData, backendImage, selectedImage, serverUrl, setUserData } =
        useContext(userDataContext);

    const [assistantName, setAssistantName] = useState(
        userData?.AssistantName || ""
    );
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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

            const response = await axios.put(
                `${serverUrl}/api/user/update`,
                formData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (response.data.success) {
                setUserData(response.data.user);
                toast.success(response.data.message);
                navigate("/");
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update assistant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            width: "100%",
            minHeight: "100vh",
            background: "#073A4C",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>
            {/* Back Button */}
            <MdKeyboardBackspace
                size={28}
                onClick={() => navigate("/customize")}
                style={{
                    position: 'absolute',
                    top: '30px',
                    left: '30px',
                    cursor: 'pointer',
                    color: '#FFFFFF'
                }}
            />

            {/* Form Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    width: '90%',
                    maxWidth: '500px',
                    padding: '50px 40px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 10px 60px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                {/* Heading */}
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '12px',
                    textAlign: 'center',
                    fontFamily: "'Anton', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                }}>
                    NAME YOUR ASSISTANT
                </h1>

                <p style={{
                    fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '36px',
                    textAlign: 'center'
                }}>
                    Give your virtual assistant a unique identity
                </p>

                {/* Input Field */}
                <div style={{ width: '100%', marginBottom: '32px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '8px'
                    }}>
                        Assistant Name
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Orvion"
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                        style={{
                            width: '100%',
                            height: '52px',
                            padding: '0 18px',
                            fontSize: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            outline: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#FFFFFF',
                            transition: 'all 0.3s'
                        }}
                        onFocus={(e) => {
                            e.target.style.border = '1px solid rgba(255, 255, 255, 0.4)';
                            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                        }}
                        onBlur={(e) => {
                            e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                    />
                </div>

                {/* Submit Button */}
                <motion.button
                    whileHover={{ scale: loading || !assistantName.trim() ? 1 : 1.02 }}
                    whileTap={{ scale: loading || !assistantName.trim() ? 1 : 0.98 }}
                    disabled={loading || !assistantName.trim()}
                    onClick={handleUpdateAssistant}
                    style={{
                        width: '100%',
                        height: '52px',
                        background: (loading || !assistantName.trim()) ? 'rgba(255, 255, 255, 0.4)' : '#FFFFFF',
                        color: '#073A4C',
                        borderRadius: '50px',
                        border: 'none',
                        fontWeight: 700,
                        cursor: (loading || !assistantName.trim()) ? 'not-allowed' : 'pointer',
                        fontSize: '17px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 8px 30px rgba(255, 255, 255, 0.2)'
                    }}
                >
                    {loading ? "Updating..." : "Create Assistant"}
                </motion.button>
            </motion.div>
        </div>
    );
}

export default Customize2;
