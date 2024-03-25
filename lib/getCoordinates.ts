interface DataItem {
  camis: string;
  dba: string;
  longitude: string;
  latitude: string;
  violation_code: string;
  violation_description: string;
  inspection_date: string;
}

async function getCoordinates(): Promise<DataItem[]> {
  try {
    let allData: DataItem[] = [];
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const response = await fetch(
        `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$limit=50000&$offset=${offset}`
        // `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$limit=1000&$offset=${offset}`
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
    return allData;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch data");
  }
}

export default getCoordinates;
