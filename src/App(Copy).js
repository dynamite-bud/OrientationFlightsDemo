import { useEffect, useState, useRef, useCallback } from "react";

import { randomColor } from "randomcolor";

import MapGL, {
  FlyToInterpolator,
  Source,
  Layer,
  Marker,
  FullscreenControl,
  NavigationControl,
  ScaleControl,
} from "react-map-gl";

import * as turf from "@turf/turf";

import Pin from "./components/Pin";

import { useImmer } from "use-immer";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiZ2Fydml0MiIsImEiOiJja2U1Z3lvZWcxMnF2MzduN3FyZmtzaDViIn0.-XsOlUf85kWRRFa88u6aLQ";

const colorMap = new Map();

const getRandomColor = (id) => {
  if (colorMap.has(id)) {
    return colorMap.get(id);
  }
  const color = randomColor({ luminosity: "dark", format: "rgba" });
  colorMap.set(id, color);
  return color;
};

const fullscreenControlStyle = {
  top: 36,
  left: 0,
  padding: "10px",
};

const navStyle = {
  top: 72,
  left: 0,
  padding: "10px",
};

const scaleControlStyle = {
  bottom: 36,
  left: 0,
  padding: "10px",
};

const geofencesLayer = {
  id: "areas-layer",
  type: "fill",
  // layout: {},
  paint: {
    "fill-color": "green",
    "fill-opacity": 0.2,
    "fill-outline-color": "white",
  },
};

const routeLayer = {
  id: "lineLayer",
  source: "routeLayer",
  type: "line",
  paint: {
    "line-width": 2,
    "line-color": "#007cbf",
  },
};

const pointLayer = {
  id: "pointLayer",
  source: "srcPointLayer",
  type: "symbol",
  layout: {
    "icon-image": "airport-15",
    "icon-rotate": ["get", "bearing"],
    "icon-rotation-alignment": "map",
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
};

const UIET = {
  longitude: 76.7552951,
  latitude: 30.7481711,
};

// Delhi
const origin = [126.8494654, 37.5650172];

// UIET
const destination = [76.7552951, 30.7481711];

const steps = 500;

function App() {
  const [viewport, setViewport] = useState({
    latitude: 25.275005879170045,
    longitude: 78.97082512588096,
    zoom: 3.8325797292588644,
    bearing: 0,
    pitch: 0,
  });

  const mapRef = useRef();

  const counter = useRef(0);

  const [route, setRoute] = useImmer(() => {
    const lineFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [origin, destination],
      },
    };

    const lineDistance = turf.length(lineFeature);
    const arc = [];
    for (let i = 0; i < lineDistance; i += lineDistance / steps) {
      const segment = turf.along(lineFeature, i);
      arc.push(segment.geometry.coordinates);
    }
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: arc,
          },
        },
      ],
    };
  });

  const [point, setPoint] = useImmer({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: origin,
        },
      },
    ],
  });

  const animate = useCallback(() => {
    const start =
      route.features[0].geometry.coordinates[
        counter.current >= steps ? counter.current - 1 : counter.current
      ];
    const end =
      route.features[0].geometry.coordinates[
        counter.current >= steps ? counter.current : counter.current + 1
      ];
    if (!start || !end) {
      return;
    }
    setPoint((draft) => {
      draft.features[0].geometry.coordinates =
        route.features[0].geometry.coordinates[counter.current];
      draft.features[0].properties.bearing = turf.bearing(
        turf.point(start),
        turf.point(end)
      );
    });
    if (counter.current < steps) {
      window.requestAnimationFrame(animate);
    }
    counter.current++;
    //eslint-disable-next-line
  }, []);

  const sessionSetup = useCallback(async () => {
    try {
      setViewport({
        longitude: UIET.longitude,
        latitude: UIET.latitude,
        zoom: 4,
        transitionInterpolator: new FlyToInterpolator({ speed: 1 }),
        transitionDuration: "auto",
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    sessionSetup();
    animate();
    return () => {
      window.cancelAnimationFrame(animate);
      counter.current = 0;
      setPoint((draft) => {
        draft.features[0].geometry.coordinates = origin;
      });
    };
  }, [sessionSetup, animate, setPoint]);

  // const mapOnLoad = useCallback(() => {
  //   if (!mapRef.current) return;
  //   const map = mapRef.current.getMap();
  //   map.loadImage(
  //     "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
  //     (error, image) => {
  //       if (error) return;
  //       map.addImage("pin", image);
  //     }
  //   );
  // }, []);

  return (
    <>
      <MapGL
        {...viewport}
        mapStyle="mapbox://styles/garvit2/cke5j2o2c1oej19qo843rhfi4"
        width="100vw"
        height="100vh"
        onViewportChange={setViewport}
        dragRotate={false}
        mapboxApiAccessToken={MAPBOX_TOKEN}
        ref={mapRef}
        // onLoad={mapOnLoad}
      >
        <FullscreenControl style={fullscreenControlStyle} />
        <NavigationControl style={navStyle} />
        <ScaleControl style={scaleControlStyle} />
        <Source id="routeLayer" type="geojson" data={route}>
          <Layer {...routeLayer} />
        </Source>
        <Source id="srcPointLayer" type="geojson" data={point}>
          <Layer {...pointLayer} />
        </Source>
      </MapGL>
    </>
  );
}

export default App;
