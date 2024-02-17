"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon } from "ol/style";

const MarkerSvg =
  "data:image/svg+xml;charset=utf-8,%3C%3Fxml version%3D%221.0%22%20%3F%3E%3Csvg%20height%3D%2224%22%20version%3D%221.1%22%20width%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Acc%3D%22http%3A%2F%2Fcreativecommons.org%2Fns%23%22%20xmlns%3Adc%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%22%20xmlns%3Ardf%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%22%3E%3Cg%20transform%3D%22translate(0%20-1028.4)%22%3E%3Cpath%20d%3D%22m12%200c-4.4183%202.3685e-15%20-8%203.5817-8%208%200%201.421%200.3816%202.75%201.0312%203.906%200.1079%200.192%200.221%200.381%200.3438%200.563l6.625%2011.531%206.625-11.531c0.102-0.151%200.19-0.311%200.281-0.469l0.063-0.094c0.649-1.156%201.031-2.485%201.031-3.906%200-4.4183-3.582-8-8-8zm0%204c2.209%200%204%201.7909%204%204%200%202.209-1.791%204-4%204-2.2091%200-4-1.791-4-4%200-2.2091%201.7909-4%204-4z%22%20fill%3D%22%23e74c3c%22%20transform%3D%22translate(0%201028.4)%22%2F%3E%3Cpath%20d%3D%22m12%203c-2.7614%200-5%202.2386-5%205%200%202.761%202.2386%205%205%205%202.761%200%205-2.239%205-5%200-2.7614-2.239-5-5-5zm0%202c1.657%200%203%201.3431%203%203s-1.343%203-3%203-3-1.3431-3-3%201.343-3%203-3z%22%20fill%3D%22%23c0392b%22%20transform%3D%22translate(0%201028.4)%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

export default function Home() {
  useEffect(() => {
    // Convert the center coordinates to EPSG:3857 format (Spherical Mercator)
    const centerCoordinates = fromLonLat([-73.920935, 40.780229]);

    // Convert the marker coordinates to EPSG:3857 format (Spherical Mercator)
    const markerCoordinates = fromLonLat([-73.955226283657, 40.768838645926]);

    // Initialize the map
    const map = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: centerCoordinates, // Set the center coordinates
        zoom: 13, // Set an appropriate zoom level
        projection: "EPSG:3857", // Set the projection to EPSG:3857 (Spherical Mercator)
      }),
    });

    // Create a marker feature
    const marker = new Feature({
      geometry: new Point(markerCoordinates),
    });

    // Create a style for the marker
    const markerStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: MarkerSvg,
      }),
    });

    marker.setStyle(markerStyle);

    // Create a vector layer and add the marker feature to it
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [marker],
      }),
    });

    // Add the vector layer to the map
    map.addLayer(vectorLayer);

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
      <div id="map" style={{ width: "100%", height: "100vh" }}></div>
    </>
  );
}
