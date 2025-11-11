import { useEffect } from "react";

export default function Landing(){
  useEffect(() => {
    window.location.href = "/HTML/index.html";
  }, []);

  return null;
}
