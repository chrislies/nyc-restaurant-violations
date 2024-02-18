"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import {
  Style,
  Icon,
  Circle as CircleStyle,
  Stroke,
  Fill,
  Text,
} from "ol/style";
import { Cluster } from "ol/source";
import Overlay from "ol/Overlay.js";
import XYZ from "ol/source/XYZ.js";
import { toLonLat } from "ol/proj.js";
import { toStringHDMS } from "ol/coordinate.js";

const container = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");

export default function Test() {
  const [overlay, setOverlay] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const container = document.createElement("div");
    container.className = "ol-popup";
    const closer = document.createElement("a");
    closer.href = "#";
    closer.className = "ol-popup-closer";
    container.appendChild(closer);
    const content = document.createElement("div");
    content.id = "popup-content";
    container.appendChild(content);

    const newOverlay = new Overlay({
      element: container,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });
    setOverlay(newOverlay);

    closer.onclick = function () {
      newOverlay.setPosition(undefined);
      closer.blur();
      return false;
    };
  }, []);

  useEffect(() => {
    if (overlay) {
      overlay.setMap(null); // Remove previous overlay from map
      const map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([-73.920935, 40.780229]),
          zoom: 13,
        }),
      });

      map.addOverlay(overlay);

      map.on("singleclick", function (evt) {
        const coordinate = evt.coordinate;
        const hdms = toStringHDMS(toLonLat(coordinate));

        document.getElementById("popup-content").innerHTML =
          "<p>You clicked here:</p><code>" + hdms + "</code>";
        overlay.setPosition(coordinate);
      });
    }
  }, [overlay]);

  return (
    <div>
      <div id="map" className="w-full h-screen"></div>
      <div id="popup" className="ol-popup">
        <a href="#" id="popup-closer" className="ol-popup-closer"></a>
        <div id="popup-content"></div>
      </div>
    </div>
  );
}
