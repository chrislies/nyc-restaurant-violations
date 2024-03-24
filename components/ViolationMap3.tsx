import React, { useState, useEffect } from "react";
import { Map, View } from "ol";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import getCoordinates from "@/lib/getCoordinates";
import Feature from "ol/Feature.js";
import Geolocation from "ol/Geolocation.js";
import Point from "ol/geom/Point.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";

// Loader component for showing loading animation
const Loader = () => {
  return (
    <div className="absolute select-none flex flex-col justify-center items-center gap-5 z-[10000] h-screen w-screen bg-black bg-opacity-50">
      <svg
        aria-hidden="true"
        className="w-24 h-24 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <p className="font-mono text-2xl text-white tracking-wide font-semibold">
        Loading...
      </p>
    </div>
  );
};

function MapComponent() {
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<Map | null>(null);
  const [geolocation, setGeolocation] = useState<Geolocation | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getCoordinates();
        console.log(data);
        // setMarkerData(data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const initMap = () => {
      const osmLayer = new TileLayer({
        preload: Infinity,
        source: new OSM(),
      });

      const view = new View({
        center: fromLonLat([-73.88017135962203, 40.71151957593488]),
        zoom: 11,
        maxZoom: 20,
      });

      const mapInstance = new Map({
        target: "map",
        layers: [osmLayer],
        view: view,
      });

      const geolocationInstance = new Geolocation({
        // enableHighAccuracy must be set to true to have the heading value.
        trackingOptions: {
          enableHighAccuracy: true,
        },
        projection: view.getProjection(),
      });

      const accuracyFeature = new Feature();
      geolocationInstance.on("change:accuracyGeometry", function () {
        accuracyFeature.setGeometry(geolocationInstance.getAccuracyGeometry()!);
      });

      const positionFeature = new Feature();
      positionFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({
              color: "#3399CC",
            }),
            stroke: new Stroke({
              color: "#fff",
              width: 2,
            }),
          }),
        })
      );

      geolocationInstance.on("change:position", function () {
        const coordinates = geolocationInstance.getPosition();
        positionFeature.setGeometry(
          coordinates ? new Point(coordinates) : undefined
        );
      });

      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [accuracyFeature, positionFeature],
        }),
      });

      mapInstance.addLayer(vectorLayer);

      setMap(mapInstance);
      setGeolocation(geolocationInstance);
    };

    initMap();
  }, []);

  useEffect(() => {
    if (map && geolocation) {
      geolocation.setTracking(true);
      geolocation.once("change:position", function () {
        const coordinates = geolocation.getPosition();
        if (coordinates) {
          map.getView().animate({
            center: coordinates,
            zoom: 19,
            duration: 1500,
          });
        }
      });
    }
  }, [map, geolocation]);

  return (
    <>
      {loading && <Loader />}
      <div id="map" className="h-screen w-screen" />
    </>
  );
}

export default MapComponent;
