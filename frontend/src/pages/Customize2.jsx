import React, { useContext, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import axios from 'axios'
import { MdKeyboardBackspace } from "react-icons/md"
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

function Customize2() {
    const { userData, backendImage, selectedImage, serverUrl, setUserData } =
        useContext(userDataContext)

    const [assistantName, setAssistantName] = useState(
        userData?.AssistantName || ""
    )
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleUpdateAssistant = async () => {
        if (!assistantName.trim()) {
            toast.error("Assistant name is required")
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("assistantName", assistantName.trim())

            if (backendImage) {
                formData.append("assistantImage", backendImage)
            } else if (selectedImage) {
                formData.append("imageUrl", selectedImage)
            }

            const response = await axios.put(
                `${serverUrl}/api/user/update`,
                formData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                }
            )

            if (response.data.success) {
                setUserData(response.data.user)
                toast.success(response.data.message)
                navigate("/")
            } else {
                throw new Error(response.data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update assistant")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100vh",
                background: "#F5F7FA",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
            }}
        >
            {/* Embedded CSS (same system as SignIn) */}
            <style>{`
        .form-container {
          width: 480px;
          padding: 40px 32px;
          border: 1px solid rgba(222,225,230,1);
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0px 8px 24px rgba(0,0,0,0.08);

          display: flex;
          flex-direction: column;
          align-items: center;

          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1),
                      box-shadow 0.35s cubic-bezier(0.4,0,0.2,1);
        }

        .form-container:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0px 16px 40px rgba(0,0,0,0.12);
        }

        .heading {
          font-size: 34px;
          font-weight: 700;
          color: rgba(23,26,31,1);
          margin-bottom: 8px;
          text-align: center;
        }

        .subheading {
          font-size: 14px;
          color: rgba(86,93,109,1);
          margin-bottom: 28px;
          text-align: center;
        }

        .textbox {
          width: 100%;
          margin-bottom: 28px;
        }

        .textbox label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #000;
        }

        .textbox input {
          width: 100%;
          height: 50px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,1);
          outline: none;
          font-size: 16px;
          color: #000;
        }

        .primary-btn {
          width: 100%;
          height: 44px;
          background: rgba(0,183,255,1);
          color: #fff;
          border-radius: 10px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          font-size: 15px;
        }

        .primary-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .back {
          position: absolute;
          top: 30px;
          left: 30px;
          cursor: pointer;
          color: #000;
        }
      `}</style>

            <MdKeyboardBackspace
                className="back"
                size={26}
                onClick={() => navigate("/customize")}
            />

            <div className="form-container">
                <div className="heading">Name Your Assistant</div>
                <div className="subheading">
                    Give your virtual assistant a unique identity.
                </div>

                <div className="textbox">
                    <label>Assistant Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Orvion"
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                    />
                </div>

                <button
                    className="primary-btn"
                    disabled={loading || !assistantName.trim()}
                    onClick={handleUpdateAssistant}
                >
                    {loading ? "Updating..." : "Create Assistant"}
                </button>
            </div>
        </div>
    )
}

export default Customize2
