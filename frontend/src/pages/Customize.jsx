import React, { useContext, useRef } from 'react'
import Card from '../components/Card'
import image1 from "../assets/image1.png"
import image2 from "../assets/image2.jpg"
import image3 from "../assets/authBg.png"
import image4 from "../assets/image4.png"
import image5 from "../assets/image5.png"
import image6 from "../assets/image6.jpeg"
import image7 from "../assets/image7.jpeg"
import { RiImageAddLine } from "react-icons/ri"
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import { MdKeyboardBackspace } from "react-icons/md"

function Customize() {
  const {
    backendImage,
    setBackendImage,
    frontendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage
  } = useContext(userDataContext)

  const navigate = useNavigate()
  const inputImage = useRef()

  const handleImage = (e) => {
    const file = e.target.files[0]
    setBackendImage(file)
    setFrontendImage(URL.createObjectURL(file))
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
      <style>{`
        .form-container {
          width: 640px;         
          max-height: 82vh;     
          padding: 28px 24px 32px;
          border: 1px solid rgba(222,225,230,1);
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0px 8px 24px rgba(0,0,0,0.08);

          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;  

          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1),
                      box-shadow 0.35s cubic-bezier(0.4,0,0.2,1);
        }

        .form-container:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0px 16px 40px rgba(0,0,0,0.12);
        }

        .heading {
          font-size: 30px;
          font-weight: 700;
          color: rgba(23,26,31,1);
          margin-bottom: 22px;
          text-align: center;
        }

        .card-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .next-btn {
          margin-top: 28px;
          min-width: 280px;
          height: 52px;
          background: rgba(0,183,255,1);
          color: #fff;
          border-radius: 10px;
          border: none;
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
          font-weight: 500;
          cursor: pointer;
          font-size: 15px;
          position: relative;
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
        onClick={() => navigate("/")}
      />

      <div className="form-container">
        <div className="heading">
          Select Your <span style={{ color: "#00B7FF" }}>Assistant Image</span>
        </div>

        <div className="card-wrapper">
          <Card image={image1} />
          <Card image={image2} />
          <Card image={image3} />
          <Card image={image4} />
          <Card image={image5} />
          <Card image={image6} />
          <Card image={image7} />

          {/* Upload Card */}
          <div
            className={`w-[56px] h-[100px] lg:w-[120px] lg:h-[200px]
              bg-[#020220] border-2 border-[#0000ff66]
              rounded-2xl overflow-hidden cursor-pointer
              flex items-center justify-center
              transition-all duration-300
              hover:-translate-y-1 hover:scale-[1.03]
              hover:shadow-2xl hover:shadow-blue-950
              ${selectedImage === "input" ? "border-4 border-white shadow-2xl shadow-blue-950" : ""}
            `}
            onClick={() => {
              inputImage.current.click()
              setSelectedImage("input")
            }}
          >
            {!frontendImage && (
              <RiImageAddLine className="text-white w-[20px] h-[20px]" />
            )}
            {frontendImage && (
              <img src={frontendImage} className="h-full object-cover" />
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            ref={inputImage}
            hidden
            onChange={handleImage}
          />
        </div>

        {selectedImage && (
          <button
            className="next-btn"
            onClick={() => navigate("/customize2")}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

export default Customize
