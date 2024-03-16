"use client";
import dynamic from "next/dynamic";
const DynamicMapComponent = dynamic(() => import("./components/ViolationMap"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <DynamicMapComponent />
    </>
  );
}
