"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

interface DataItem {
  camis: string;
  dba: string;
  violation_code: string;
  violation_description: string;
  longitude: string;
  latitude: string;
}

export default function Dataset() {
  const [dataArray, setDataArray] = useState<DataItem[]>([]);
  const [violationsCount, setViolationsCount] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        let allData: DataItem[] = [];
        let offset = 0;
        let hasMoreData = true;

        while (hasMoreData) {
          const response = await fetch(
            // `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$limit=50000&$offset=${offset}`
            `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$limit=1000&$offset=${offset}`
          );
          const data: DataItem[] = await response.json();

          if (data.length === 0) {
            hasMoreData = false;
          } else {
            allData = [
              ...allData,
              ...data.map((item) => ({
                ...item,
                latitude: item.latitude ?? "", // Ensure latitude is not null or undefined
                longitude: item.longitude ?? "", // Ensure longitude is not null or undefined
              })),
            ];
            offset += 50000;
          }
        }

        setDataArray(allData);

        // Count violation(s) for each restaurant
        const violationsCountObj: { [key: string]: number } = {};
        allData.forEach((item) => {
          violationsCountObj[item.camis] = violationsCountObj[item.camis]
            ? violationsCountObj[item.camis] + 1
            : 1;
        });
        setViolationsCount(violationsCountObj);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle error gracefully, e.g., display an error message on UI
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <button>
        <Link href="/">Home</Link>
      </button>
      <div>
        <ul>
          {dataArray.map((item, index) =>
            item.violation_code ? (
              <li key={index}>
                {index} {item.dba} - {item.violation_description} (
                {violationsCount[item.camis] ?? 0} violations) - Latitude:{" "}
                {item.latitude}, Longitude: {item.longitude}
              </li>
            ) : null
          )}
        </ul>
      </div>
    </>
  );
}
