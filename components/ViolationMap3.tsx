import React, { useState, useEffect, useRef } from "react";
import { Map, View } from "ol";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import getCoordinates from "@/lib/getCoordinates";
import Feature from "ol/Feature.js";
import Geolocation from "ol/Geolocation.js";
import Point from "ol/geom/Point.js";
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Icon,
  Text,
} from "ol/style.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import Loader from "./Loader";
import { Cluster } from "ol/source";
import Overlay from "ol/Overlay.js";
import { Layers, Locate } from "./svgs";
import { XYZ } from "ol/source";

interface DataItem {
  camis: string;
  dba: string;
  longitude: string;
  latitude: string;
  violation_code: string;
  violation_description: string;
  inspection_date: string;
}

interface Violation {
  inspectionDate: string;
  violationCode: string;
  violationDescription: string;
}

const MarkerSvg =
  "data:image/svg+xml;charset=utf-8,%3C%3Fxml version%3D%221.0%22%20%3F%3E%3Csvg%20height%3D%2224%22%20version%3D%221.1%22%20width%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Acc%3D%22http%3A%2F%2Fcreativecommons.org%2Fns%23%22%20xmlns%3Adc%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%22%20xmlns%3Ardf%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%22%3E%3Cg%20transform%3D%22translate(0%20-1028.4)%22%3E%3Cpath%20d%3D%22m12%200c-4.4183%202.3685e-15%20-8%203.5817-8%208%200%201.421%200.3816%202.75%201.0312%203.906%200.1079%200.192%200.221%200.381%200.3438%200.563l6.625%2011.531%206.625-11.531c0.102-0.151%200.19-0.311%200.281-0.469l0.063-0.094c0.649-1.156%201.031-2.485%201.031-3.906%200-4.4183-3.582-8-8-8zm0%204c2.209%200%204%201.7909%204%204%200%202.209-1.791%204-4%204-2.2091%200-4-1.791-4-4%200-2.2091%201.7909-4%204-4z%22%20fill%3D%22%23e74c3c%22%20transform%3D%22translate(0%201028.4)%22%2F%3E%3Cpath%20d%3D%22m12%203c-2.7614%200-5%202.2386-5%205%200%202.761%202.2386%205%205%205%202.761%200%205-2.239%205-5%200-2.7614-2.239-5-5-5zm0%202c1.657%200%203%201.3431%203%203s-1.343%203-3%203-3-1.3431-3-3%201.343-3%203-3z%22%20fill%3D%22%23c0392b%22%20transform%3D%22translate(0%201028.4)%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

const calculateClusterDistance = (zoom: number | undefined) => {
  if (zoom === undefined) return 50; // Default cluster distance

  switch (true) {
    case zoom <= 10:
      return 100;
    case zoom <= 15:
      return 50;
    case zoom <= 20:
      return 10;
    default:
      return 0;
  }
};

if (typeof document !== "undefined") {
  const container = document.getElementById("popup");
  const content = document.getElementById("popup-content");
  const closer = document.getElementById("popup-closer");
}

function MapComponent() {
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<Map | null>(null);
  const [mapLayer, setMapLayer] = useState<string>("osmLayer");
  const [geolocation, setGeolocation] = useState<Geolocation | null>(null);
  const [dataArray, setDataArray] = useState<DataItem[]>([]);
  const addedCoordinates = useRef<Set<string>>(new Set());
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const violationsMap = new Map();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getCoordinates();
        // console.log(data);
        setDataArray(data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    // fetchData();
  }, []);

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

  const closeModal = () => {
    setModalVisible(false);
  };

  const toggleLayer = () => {
    setMapLayer((prevMapLayer) =>
      prevMapLayer === "osmLayer" ? "satelliteLayer" : "osmLayer"
    );
  };

  const locateMe = () => {
    if (map && geolocation) {
      const coordinates = geolocation.getPosition();
      if (coordinates) {
        map.getView().animate({
          center: coordinates,
          zoom: 19,
          duration: 1000,
        });
      }
    }
  };

  useEffect(() => {
    const initMap = () => {
      const osmLayer = new TileLayer({
        preload: Infinity,
        source: new OSM(),
      });

      const satelliteLayer = new TileLayer({
        preload: Infinity,
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        }),
      });

      const layer = mapLayer === "osmLayer" ? osmLayer : satelliteLayer;

      const view = new View({
        center: fromLonLat([-73.88017135962203, 40.71151957593488]),
        zoom: 11,
        maxZoom: 20,
      });

      const mapInstance = new Map({
        target: "map",
        layers: [layer],
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

  useEffect(() => {
    if (map && overlay && dataArray) {
      overlay.setMap(map);

      // Disable right-clicking on the map
      map.addEventListener("contextmenu", function (event) {
        event.preventDefault();
      });

      map.on("singleclick", function (evt) {
        const feature = map.forEachFeatureAtPixel(
          evt.pixel,
          function (feature, layer) {
            if (layer instanceof VectorLayer) {
              if (layer.getSource() instanceof Cluster) {
                const features = feature.get("features");
                const zoomLevel = map.getView().getZoom();
                if (features && zoomLevel !== undefined) {
                  if (
                    features.length < 51 ||
                    (features.length > 50 && zoomLevel >= 15)
                  ) {
                    return features;
                  }
                }
              } else {
                return feature;
              }
            }
          }
        );

        if (feature) {
          // console.log(feature);
          const coordinate = evt.coordinate;
          let popupContent = "";

          // prettier-ignore
          if (Array.isArray(feature)) {
            // If it's an array of features (cluster with less than 11 markers)
            if (feature.length > 1) {
              // Check if there are more than 1 markers
              popupContent =
                "<p><u>Restaurants [# of Violations]:</u></p><ul>";
              feature.forEach((individualFeature, index) => {
                const camis = individualFeature.get("camis");
                const violationsSet = violationsMap.get(camis);
                const numViolations = violationsSet ? violationsSet.size : 0;
                // <span class="restaurant-name" data-camis="${camis}" data-dba="${individualFeature.get("dba")}" style="cursor: pointer;">${individualFeature.get("dba")} <span class="text-xs text-red-500">[${numViolations}]</span></span>
                popupContent += `
                <li class="grid grid-cols-[15%,85%]">
                  <span>${index + 1}.</span>
                  <div class="restaurant-name" data-camis="${camis}" data-dba="${individualFeature.get("dba")}" style="cursor: pointer;">
                      <span>${individualFeature.get("dba")}</span>
                      <span class="text-xs text-red-500">[${numViolations}]</span>
                  </div>
                </li>
                `;
              });
              popupContent += "</ul>";
            } else {
              // there is only one marker in the cluster
              const camis = feature[0].get("camis");
              const violationsSet = violationsMap.get(camis);
              const numViolations = violationsSet ? violationsSet.size : 0;
              popupContent = `
              <p><u>Restaurant [# of Violations]:</u></p>
              <code class="restaurant-name" data-camis="${camis}" data-dba="${feature[0].get("dba")}" style="cursor: pointer;">
                <span>${feature[0].get("dba")}</span>
                <span class="text-xs text-red-500">[${numViolations}]</span>
              </code>`;
            }
          } else {
            // If it's the user marker
            popupContent = `
            <code class="user-popup">
              <p>You are in this area</p>
            </code>`;
          }

          (document.getElementById("popup-content") as HTMLElement).innerHTML =
            popupContent;
          overlay.setPosition(coordinate);

          // Add event listeners to restaurant names
          const restaurantNames = document.querySelectorAll(".restaurant-name");
          restaurantNames.forEach((restaurantName) => {
            restaurantName.addEventListener("click", function (event) {
              const camis =
                (event.currentTarget as HTMLElement)?.getAttribute(
                  "data-camis"
                ) ?? "Default Value";
              const dba =
                (event.currentTarget as HTMLElement)?.getAttribute(
                  "data-dba"
                ) ?? "Default Value";
              if (camis) {
                // Toggle font-bold class on click
                const targetElement = event.currentTarget as HTMLElement;
                if (targetElement) {
                  document
                    .querySelectorAll(".restaurant-name")
                    .forEach((name) => {
                      name.classList.remove("underline", "decoration-2");
                    });

                  targetElement.classList.add("underline", "decoration-2");
                }
              }
              showModal(camis, dba);
            });
          });
        } else {
          overlay.setPosition(undefined);
          closeModal();
        }
      });

      const openModal = (content: string) => {
        setModalContent(content);
        setModalVisible(true);
      };

      const showModal = (camis: string, dba: string) => {
        // Fetch the violations for the specified restaurant (camis)
        const violationsSet = violationsMap.get(camis);
        let violationsArray: Violation[] = [];
        if (violationsSet) {
          // Convert Set to array and iterate over its elements
          Array.from<Violation>(violationsSet).forEach(
            (violation: Violation) => {
              violationsArray.push(violation);
            }
          );
        }

        const parseDate = (dateString: string): Date => {
          const [month, day, year] = dateString.split("-").map(Number);
          return new Date(year, month - 1, day);
        };

        // Sort violationsArray based on inspectionDate
        violationsArray.sort((a, b) => {
          const dateA = parseDate(a.inspectionDate);
          const dateB = parseDate(b.inspectionDate);
          return dateB.getTime() - dateA.getTime();
        });

        // Generate HTML content for the violations list
        let violationsListHTML = "";
        let violationIndex = 1;
        // prettier-ignore
        if (violationsArray.length > 0) {
          violationsListHTML = "<ol>";
          violationsArray.forEach((violation: Violation) => {
            violationsListHTML += `
            <div>
              <li class="grid grid-cols-[.1fr,.9fr]">
                <span><strong>${violationIndex++}.</strong></span>
                <span class="flex flex-col">
                  <span><strong>${violation.violationCode}:</strong> ${violation.violationDescription}</span>
                </span>
              </li>
              <span class="flex justify-end"><i>${violation.inspectionDate}</i></span>
              ${violationIndex - 1 !== violationsArray.length ? `<div class="border-t"/>`: ""}
            </div>
            `;
          });
          violationsListHTML += "</ol>";
        } else {
          violationsListHTML = "<p>No violations found.</p>";
        }

        // Display the violations in a modal
        const modalContent = `
          <div>
              <h2><u>Violations for <strong>${dba}</strong></u></h2>
              ${violationsListHTML}
          </div>
        `;

        openModal(modalContent);
      };

      // Create a vector source to hold the markers
      const vectorSource = new VectorSource();
      // Track violation codes for each restaurant
      const violationCodesMap = new Map();
      // const violationsMap = new Map();

      // Add markers for each restaurant
      dataArray.forEach((item) => {
        const latitude = parseFloat(item.latitude);
        const longitude = parseFloat(item.longitude);
        const camis = item.camis;
        const violationCode = item.violation_code;
        const violationDescription = item.violation_description;
        const inspectionDate =
          item.inspection_date.slice(5, 7) +
          "-" +
          item.inspection_date.slice(8, 10) +
          "-" +
          item.inspection_date.slice(0, 4);

        if (camis && violationCode && violationDescription) {
          const violationData = {
            inspectionDate,
            violationCode,
            violationDescription,
          };
          const violationsSet = violationsMap.get(camis) || new Set<string>();
          violationsSet.add(violationData);
          violationsMap.set(camis, violationsSet);
        }

        if (!isNaN(latitude) && !isNaN(longitude)) {
          const coordinateKey = `${camis},${latitude},${longitude}`;

          if (!addedCoordinates.current.has(coordinateKey)) {
            const marker = new Feature({
              geometry: new Point(fromLonLat([longitude, latitude])),
            });

            // Set attributes from DataItem interface
            marker.set("camis", item.camis);
            marker.set("dba", item.dba);
            marker.set("longitude", item.longitude);
            marker.set("latitude", item.latitude);
            marker.set("violation_code", item.violation_code);
            marker.set("violation_description", item.violation_description);
            marker.set("inspection_date", item.inspection_date);

            vectorSource.addFeature(marker);
            addedCoordinates.current.add(coordinateKey);
            // console.log(`Marker added: ${coordinateKey}`);
          }
        }
      });

      // Create a cluster source
      const clusterSource = new Cluster({
        distance: calculateClusterDistance(map.getView().getZoom() ?? 0),
        source: vectorSource,
      });

      // Update cluster source distance when map is zoomed
      map.getView().on("change:resolution", () => {
        clusterSource.setDistance(
          calculateClusterDistance(map.getView().getZoom() ?? 0)
        );
      });

      // Create a vector layer with the cluster source
      const clusterLayer = new VectorLayer({
        source: clusterSource,
        style: (feature) => {
          const size = feature.get("features").length;
          if (size === 1) {
            // Individual marker
            return new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: MarkerSvg,
              }),
            });
          } else {
            // Cluster
            return new Style({
              image: new CircleStyle({
                radius: 10,
                fill: new Fill({
                  color: "#3399CC",
                }),
                stroke: new Stroke({
                  color: "#fff",
                  width: 2,
                }),
              }),
              text: new Text({
                text: size.toString(),
                fill: new Fill({
                  color: "#fff",
                }),
              }),
            });
          }
        },
      });

      // Add the cluster layer to the map
      map.addLayer(clusterLayer);
    }
  }, [map, overlay, dataArray]);

  useEffect(() => {
    const handleClickOutsideModal = (event: MouseEvent) => {
      const modalContent = document.querySelector(".modal-content");
      const modal = document.querySelector(".modal");
      if (modal && modal === event.target) {
        closeModal();
      }
    };

    document.addEventListener("mouseup", handleClickOutsideModal);

    return () => {
      document.removeEventListener("mouseup", handleClickOutsideModal);
    };
  }, []);

  return (
    <>
      {loading && <Loader />}
      <div className="absolute bottom-0 flex flex-col justify-between m-3 gap-2">
        <button
          onClick={locateMe}
          title="Locate Me"
          aria-label="Locate Me"
          aria-disabled="false"
          className="z-[999] select-none cursor-pointer relative w-[36px] h-[36px] p-0 bg-white hover:bg-gray-100 text-black rounded-md border-2 border-[rgba(0,0,0,0.2)] shadow-md"
        >
          <span className="absolute top-[-16px] left-[-16px] scale-[.4]">
            <Locate />
          </span>
        </button>
        <button
          onClick={toggleLayer}
          title="Toggle Layers"
          aria-label="Toggle Layers"
          aria-disabled="false"
          className="z-[999] select-none cursor-pointer relative w-[50px] h-[50px] p-0 bg-white hover:bg-gray-100 text-black rounded-md border-2 border-[rgba(0,0,0,0.2)] shadow-md"
        >
          <span className="absolute top-[-9px] left-[-9px] scale-50">
            <Layers />
          </span>
        </button>
      </div>
      <div id="map" className="h-screen w-screen" />
      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <div dangerouslySetInnerHTML={{ __html: modalContent }}></div>
          </div>
        </div>
      )}
    </>
  );
}

export default MapComponent;
