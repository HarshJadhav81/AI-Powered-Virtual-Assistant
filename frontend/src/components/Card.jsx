import React, { useContext } from "react";
import { userDataContext } from "../context/UserContext";

function Card({ image }) {
  const {
    setBackendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage,
  } = useContext(userDataContext);

  return (
    <div
      onClick={() => {
        setSelectedImage(image);
        setBackendImage(null);
        setFrontendImage(null);
      }}
      className={`
        w-[64px] h-[112px]
        lg:w-[120px] lg:h-[200px]
        bg-[#020220]
        border-2 border-[#00000066]
        rounded-xl
        overflow-hidden
        cursor-pointer
        flex items-center justify-center

        transition-all duration-300
        ease-[cubic-bezier(0.4,0,0.2,1)]

        hover:-translate-y-[6px]
        hover:scale-[1.03]
        hover:shadow-2xl
        hover:shadow-blue-950
        hover:border-white

        ${selectedImage === image
          ? "border-4 border-white shadow-2xl shadow-blue-950"
          : ""
        }
      `}
    >
      {/* IMAGE WRAPPER */}
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={image}
          alt="assistant"
          className="
            w-full h-full
            object-cover
            select-none
            pointer-events-none
          "
        />
      </div>
    </div>
  );
}

export default Card;
