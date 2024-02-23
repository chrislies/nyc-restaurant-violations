"use client";
import React, { useState, useEffect } from "react";

export default function Test() {
  const [renderDiv, setRenderDiv] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setRenderDiv(true); // Set renderDiv to true after 5 seconds
    }, 5000);

    return () => clearTimeout(timerId); // Cleanup the timer if component unmounts
  }, []);

  return <div>{renderDiv && <div>page</div>}</div>;
}
