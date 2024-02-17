import React from "react";

const defaultEndpoint = "https://data.cityofnewyork.us/resource/43nn-pn8j.json";

async function getData() {
  const res = await fetch(defaultEndpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function data() {
  const data = await getData();
  console.log("data:", data);
  return (
    <div>
      <ul>
        {data.map((item, index) => (
          <li>
            {item.dba} {item.longitude} {item.latitude}
          </li>
        ))}
      </ul>
    </div>
  );
}
