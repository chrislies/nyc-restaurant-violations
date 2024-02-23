import { Suspense } from "react";
import ViolationMap from "./components/ViolationMap";
import Loading from "./loading";

export default function Home() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <ViolationMap />
      </Suspense>
    </>
  );
}
