import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Ship, Package, Calendar, MapPin, X } from "lucide-react";

interface Vessel {
  id: string;
  name: string;
  containers: number;
  origin: string;
  destination: string;
  eta: string;
  etd: string;
  mode: "sea" | "air" | "road";
  progress: number;
  coordinates: [number, number];
  route: [number, number][];
  segments?: {
    from: string;
    to: string;
    mode: "sea" | "air" | "road";
    completed: boolean;
  }[];
  containerList?: { id: string; status: string; weight: string }[];
}

const vessels: Vessel[] = [
  {
    id: "VSL001",
    name: "Ocean Voyager",
    containers: 245,
    origin: "Qingdao Port (CNQDG)",
    destination: "London Gateway (GBLGP)",
    eta: "2025-12-01",
    etd: "2025-11-15",
    mode: "sea",
    progress: 65,
    coordinates: [104.794, 1.78514],
    route: [
      [114.287, 22.5693], // Qingdao
      [109.777, 9.99833], // Mid point
      [106.532, 4.93667], // Mid point
      [104.794, 1.78514], // Singapore (current)
      [80.0, 10.0],
      [60.0, 15.0],
      [-0.5, 51.5], // London
    ],
    segments: [
      { from: "Warehouse", to: "Qingdao Port", mode: "road", completed: true },
      { from: "Qingdao Port", to: "Singapore", mode: "sea", completed: true },
      { from: "Singapore", to: "London Gateway", mode: "sea", completed: false },
      { from: "London Gateway", to: "Delivery", mode: "road", completed: false },
    ],
    containerList: [
      { id: "CONT-001", status: "In Transit", weight: "2,500 kg" },
      { id: "CONT-002", status: "In Transit", weight: "3,200 kg" },
      { id: "CONT-003", status: "In Transit", weight: "1,800 kg" },
    ],
  },
  {
    id: "VSL002",
    name: "Sky Carrier",
    containers: 120,
    origin: "Shanghai Port",
    destination: "Los Angeles Port",
    eta: "2025-11-25",
    etd: "2025-11-18",
    mode: "air",
    progress: 45,
    coordinates: [121.4737, 31.2304],
    route: [
      [121.4737, 31.2304], // Shanghai
      [140.0, 35.0],
      [150.0, 35.0],
      [160.0, 40.0],
      [-118.2437, 34.0522], // Los Angeles
    ],
    segments: [
      { from: "Warehouse", to: "Shanghai Airport", mode: "road", completed: true },
      { from: "Shanghai Airport", to: "LA Airport", mode: "air", completed: false },
      { from: "LA Airport", to: "Delivery", mode: "road", completed: false },
    ],
    containerList: [
      { id: "AIR-001", status: "In Transit", weight: "500 kg" },
      { id: "AIR-002", status: "In Transit", weight: "750 kg" },
    ],
  },
  {
    id: "VSL003",
    name: "Euro Express",
    containers: 85,
    origin: "Hamburg Port",
    destination: "New York Port",
    eta: "N/A",
    etd: "2025-11-20",
    mode: "sea",
    progress: 30,
    coordinates: [9.9937, 53.5511],
    route: [
      [9.9937, 53.5511], // Hamburg
      [-10.0, 53.0],
      [-20.0, 50.0],
      [-40.0, 45.0],
      [-74.006, 40.7128], // New York
    ],
    segments: [
      { from: "Warehouse", to: "Hamburg Port", mode: "road", completed: true },
      { from: "Hamburg Port", to: "New York Port", mode: "sea", completed: false },
    ],
  },
  {
    id: "VSL004",
    name: "Atlantic Star",
    containers: 180,
    origin: "Rotterdam Port",
    destination: "Southampton Port (GBLGP)",
    eta: "2025-11-22",
    etd: "2025-11-19",
    mode: "sea",
    progress: 55,
    coordinates: [2.5, 52.0],
    route: [
      [4.477, 51.924], // Rotterdam
      [2.5, 52.0], // North Sea (current)
      [-1.404, 50.908], // Southampton
    ],
    segments: [
      { from: "Warehouse", to: "Rotterdam Port", mode: "road", completed: true },
      { from: "Rotterdam Port", to: "Southampton Port", mode: "sea", completed: false },
      { from: "Southampton Port", to: "Delivery", mode: "road", completed: false },
    ],
    containerList: [
      { id: "CONT-201", status: "In Transit", weight: "2,100 kg" },
      { id: "CONT-202", status: "In Transit", weight: "2,800 kg" },
      { id: "CONT-203", status: "In Transit", weight: "1,950 kg" },
    ],
  },
];

const ShipmentMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoicmFtcmsiLCJhIjoiY21pMnJtZ210MWJ5aTJpc2ZlZDA0NDJwbCJ9.xoIYILnPn4wZpzM_zZBGTQ";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      projection: { name: "mercator" },
      zoom: 1.5,
      center: [30, 20],
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;

      // Add vessel data as GeoJSON source
      map.current.addSource("vessels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: vessels.map((vessel) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: vessel.coordinates,
            },
            properties: {
              id: vessel.id,
              name: vessel.name,
              containers: vessel.containers,
              origin: vessel.origin,
              destination: vessel.destination,
              eta: vessel.eta,
              etd: vessel.etd,
              mode: vessel.mode,
              progress: vessel.progress,
            },
          })),
        },
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 50,
      });

      // Add cluster circles
      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "vessels",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#3b82f6",
            5,
            "#2563eb",
            10,
            "#1d4ed8",
          ],
          "circle-radius": ["step", ["get", "point_count"], 20, 5, 30, 10, 40],
        },
      });

      // Add cluster count
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "vessels",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Add vessel icons for unclustered points
      map.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "vessels",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#3b82f6",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Click on cluster to zoom in
      map.current.on("click", "clusters", (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        const source = map.current.getSource("vessels") as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;

          map.current.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom,
          });
        });
      });

      // Show popup on vessel click
      map.current.on("click", "unclustered-point", (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const vesselId = e.features[0].properties?.id;
        const vessel = vessels.find((v) => v.id === vesselId);

        if (!vessel || !map.current) return;

        // Zoom to vessel and show route
        const bounds = new mapboxgl.LngLatBounds();
        vessel.route.forEach((coord) => bounds.extend(coord as [number, number]));
        
        map.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000,
        });

        // Add route layer
        if (map.current.getSource("route")) {
          (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: vessel.route,
            },
            properties: {},
          });
        } else {
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: vessel.route,
              },
              properties: {},
            },
          });

          // Completed portion (blue)
          map.current.addLayer({
            id: "route-completed",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3b82f6",
              "line-width": 4,
            },
          });

          // Upcoming portion (gray) - overlay
          map.current.addLayer({
            id: "route-upcoming",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#9ca3af",
              "line-width": 4,
              "line-dasharray": [2, 2],
            },
          });
        }

        // Add origin port marker (green)
        const originCoord = vessel.route[0];
        if (map.current.getSource("origin-port")) {
          (map.current.getSource("origin-port") as mapboxgl.GeoJSONSource).setData({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: originCoord,
            },
            properties: {},
          });
        } else {
          map.current.addSource("origin-port", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: originCoord,
              },
              properties: {},
            },
          });

          map.current.addLayer({
            id: "origin-port-icon",
            type: "circle",
            source: "origin-port",
            paint: {
              "circle-radius": 10,
              "circle-color": "#22c55e",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });
        }

        // Add destination port marker (red)
        const destinationCoord = vessel.route[vessel.route.length - 1];
        if (map.current.getSource("destination-port")) {
          (map.current.getSource("destination-port") as mapboxgl.GeoJSONSource).setData({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: destinationCoord,
            },
            properties: {},
          });
        } else {
          map.current.addSource("destination-port", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: destinationCoord,
              },
              properties: {},
            },
          });

          map.current.addLayer({
            id: "destination-port-icon",
            type: "circle",
            source: "destination-port",
            paint: {
              "circle-radius": 10,
              "circle-color": "#ef4444",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });
        }

        setSelectedVessel(vessel);
      });

      // Change cursor on hover
      map.current.on("mouseenter", "clusters", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "clusters", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });
      map.current.on("mouseenter", "unclustered-point", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "unclustered-point", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });

      // Show hover popup for vessels
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
      });

      map.current.on("mouseenter", "unclustered-point", (e) => {
        if (!e.features || e.features.length === 0 || !map.current) return;
        
        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const props = e.features[0].properties;

        popup
          .setLngLat(coordinates)
          .setHTML(
            `<div class="p-2">
              <p class="font-semibold text-sm">${props.name}</p>
              <p class="text-xs text-muted-foreground">Containers: ${props.containers}</p>
              <p class="text-xs text-muted-foreground">Progress: ${props.progress}%</p>
              <p class="text-xs text-muted-foreground">ETA: ${props.eta}</p>
            </div>`
          )
          .addTo(map.current);
      });

      map.current.on("mouseleave", "unclustered-point", () => {
        popup.remove();
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const closeDetailPopup = () => {
    setSelectedVessel(null);
    
    if (map.current) {
      // Remove route layers
      if (map.current.getLayer("route-completed")) {
        map.current.removeLayer("route-completed");
      }
      if (map.current.getLayer("route-upcoming")) {
        map.current.removeLayer("route-upcoming");
      }
      if (map.current.getSource("route")) {
        map.current.removeSource("route");
      }

      // Remove port markers
      if (map.current.getLayer("origin-port-icon")) {
        map.current.removeLayer("origin-port-icon");
      }
      if (map.current.getSource("origin-port")) {
        map.current.removeSource("origin-port");
      }
      if (map.current.getLayer("destination-port-icon")) {
        map.current.removeLayer("destination-port-icon");
      }
      if (map.current.getSource("destination-port")) {
        map.current.removeSource("destination-port");
      }

      // Reset view
      map.current.easeTo({
        center: [30, 20],
        zoom: 1.5,
        duration: 1000,
      });
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div ref={mapContainer} className="w-full h-[500px] md:h-[560px] lg:h-[600px] xl:h-[700px]" />
      
      {selectedVessel && (
        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-sm max-h-[calc(100%-2rem)] overflow-y-auto border">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                {selectedVessel.name}
              </h3>
              <p className="text-xs text-muted-foreground">{selectedVessel.id}</p>
            </div>
            <button
              onClick={closeDetailPopup}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Route</p>
                <p className="font-medium">{selectedVessel.origin}</p>
                <p className="text-muted-foreground">→</p>
                <p className="font-medium">{selectedVessel.destination}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">ETD / ETA</p>
                <p className="font-medium">{selectedVessel.etd} → {selectedVessel.eta}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Containers</p>
                <p className="font-medium">{selectedVessel.containers}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-xs mb-1">Progress</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${selectedVessel.progress}%` }}
                />
              </div>
              <p className="text-xs text-right mt-1">{selectedVessel.progress}%</p>
            </div>

            {selectedVessel.segments && (
              <div>
                <p className="font-medium mb-2">Journey Segments</p>
                <div className="space-y-2">
                  {selectedVessel.segments.map((segment, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs p-2 rounded ${
                        segment.completed ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          segment.completed ? "bg-primary" : "bg-muted-foreground"
                        }`}
                      />
                      <span>{segment.from} → {segment.to}</span>
                      <span className="ml-auto capitalize">{segment.mode}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVessel.containerList && (
              <div>
                <p className="font-medium mb-2">Container Details</p>
                <div className="space-y-1">
                  {selectedVessel.containerList.map((container) => (
                    <div
                      key={container.id}
                      className="flex justify-between text-xs p-2 rounded bg-muted"
                    >
                      <span className="font-medium">{container.id}</span>
                      <span className="text-muted-foreground">{container.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ShipmentMap;
