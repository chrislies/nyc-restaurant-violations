"use client";
import dynamic from "next/dynamic";
const DynamicMapComponent = dynamic(
  () => import("../components/ViolationMap3"),
  {
    ssr: false,
  }
);

export default function Home() {
  return (
    <>
      <DynamicMapComponent />
    </>
  );
}
