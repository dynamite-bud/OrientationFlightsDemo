import { useEffect, useRef, useCallback, useMemo, memo } from "react";

import { randomColor } from "randomcolor";

import { Marker, Source, Layer } from "react-map-gl";
import Pin from "./Pin";

import * as turf from "@turf/turf";

import { useImmer } from "use-immer";

// Delhi
// const origin = [126.8494654, 37.5650172];

// UIET
const destination = [76.7552951, 30.7481711];

const steps = 500;

function Arc({ originLng, originLat, uniqueId, color }) {
  const routeLayer = useMemo(() => {
    return {
      id: `route_lyr_${uniqueId}`,
      source: `route_src_${uniqueId}`,
      type: "line",
      paint: {
        "line-width": 2,
        "line-color": "#007cbf",
      },
    };
  }, [uniqueId]);

  const pointLayer = useMemo(() => {
    return {
      id: `point_lyr_${uniqueId}`,
      source: `point_src_${uniqueId}`,
      type: "symbol",
      layout: {
        "icon-image": "airport-15",
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    };
  }, [uniqueId]);

  const counter = useRef(0);

  const route = useMemo(() => {
    const lineFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [[originLng, originLat], destination],
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
  }, [originLat, originLng]);

  const [point, setPoint] = useImmer({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [originLng, originLat],
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

  useEffect(() => {
    animate();
    return () => {
      window.cancelAnimationFrame(animate);
      counter.current = 0;
      setPoint((draft) => {
        draft.features[0].geometry.coordinates = [originLng, originLat];
      });
    };
  }, [animate, setPoint, originLng, originLat]);

  return (
    <>
      <Marker
        longitude={originLng}
        latitude={originLat}
        offsetTop={-20}
        offsetLeft={-10}
      >
        <Pin size={20} color={color} />
        {/* <p className="text-white">Dubai</p> */}
      </Marker>
      <Source id={`route_src_${uniqueId}`} type="geojson" data={route}>
        <Layer {...routeLayer} />
      </Source>
      <Source id={`point_src_${uniqueId}`} type="geojson" data={point}>
        <Layer {...pointLayer} />
      </Source>
    </>
  );
}

export default memo(Arc);
