"use client"
import Link from "next/link";
import { useEffect } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

export default function Home() {
  useEffect(() => {
    // Convert the coordinates to EPSG:4326 format (WGS84)
    const centerCoordinates = [-73.920935, 40.780229];

    // Initialize the map
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: centerCoordinates, // Set the center coordinates
        zoom: 12, // Set an appropriate zoom level
        projection: 'EPSG:4326', // Set the projection to EPSG:4326 (WGS84)
      }),
    });

    return () => {
      // Clean up map on unmount if needed
      map.setTarget(undefined);
    };
  }, []);


  return (
    <>
      <button>
        <Link href="dataset">dataset</Link>
      </button>
      <div id="map" style={{ width: '100%', height: '400px' }}></div>

    </>
  );
}
