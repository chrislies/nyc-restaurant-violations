"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface DataItem {
  camis: string;
  dba: string;
  violation_code: string;
  violation_description: string;
}

export default function dataset() {
  const [dataArray, setDataArray] = useState<DataItem[]>([]); // Change to DataItem[]
  const [violationsCount, setViolationsCount] = useState<{ [key: string]: number }>({}); // Object to store violations count

  useEffect(() => {
    // Fetch the JSON data from the API endpoint
    fetch('https://data.cityofnewyork.us/resource/43nn-pn8j.json?$offset=1000')
      .then((response: Response) => response.json()) // Parse the JSON response
      .then((data: DataItem[]) => {
        // Extracting dba and violation_code arrays
        const idArray = data.map(item => item.camis);
        const dbaArray = data.map(item => item.dba);
        const violationCodeArray = data.map(item => item.violation_code);
        const violationDescription = data.map(item => item.violation_description);
        // Setting the dataArray state with DataItem array
        setDataArray(data);

        // Count violation(s) for each restaurant 
        const violationsCountObj: { [key: string]: number } = {};
        data.forEach(item => {
          if (item.camis in violationsCountObj) {
            violationsCountObj[item.camis]++;
          } else {
            violationsCountObj[item.camis] = 1;
          }
        });
        setViolationsCount(violationsCountObj);
      })
      .catch((error: Error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <>
      <button>
        <Link href="/">Home</Link>
      </button>
      <div>
        <ol>
          {dataArray.map((item, index) => (
            (item.violation_code? 
            <li key={index}>
              {item.dba} - {item.violation_description} ({violationsCount[item.camis]} violations)
            </li>
            : null)
          ))}
        </ol>
      </div>
    </>
  );
}
