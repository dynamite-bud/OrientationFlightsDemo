import { useEffect, useState, useRef, useCallback } from "react";

import { randomColor } from "randomcolor";

import MapGL, {
  FlyToInterpolator,
  FullscreenControl,
  NavigationControl,
  ScaleControl,
} from "react-map-gl";

import {
  connect,
  StringCodec,
  JSONCodec,
  AckPolicy,
  consumerOpts,
  createInbox,
} from "../node_modules/nats.ws/lib/src/mod.js";

import { useImmer } from "use-immer";
import Arc from "./components/Arc";
import { uniq } from "autoprefixer/lib/utils";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiZ2Fydml0MiIsImEiOiJja2U1Z3lvZWcxMnF2MzduN3FyZmtzaDViIn0.-XsOlUf85kWRRFa88u6aLQ";

const uniqueIdMap = new Map();
const colorMap = new Map();

const getRandomColor = (id) => {
  if (colorMap.has(id)) {
    return colorMap.get(id);
  }
  const color = randomColor({
    luminosity: "bright",
    format: "hex", // e.g. 'rgb(225,200,20)'
  });
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

const UIET = {
  longitude: 76.7552951,
  latitude: 30.7481711,
};

const jc = JSONCodec();

function App() {
  const [viewport, setViewport] = useState({
    latitude: 25.275005879170045,
    longitude: 78.97082512588096,
    zoom: 3.8325797292588644,
    bearing: 0,
    pitch: 0,
  });

  const [natsConnection, setConnection] = useState(undefined);
  const [lastError, setError] = useState(undefined);

  const mapRef = useRef();
  const originSub = useRef();
  const [origins, setOrigins] = useImmer([
    [126.8494654, 37.5650172],
    [115.837023, 39.9375346],
    [54.947555, 25.0757595],
  ]);

  const connectToNats = useCallback(async () => {
    try {
      const connection = await connect({
        servers: ["ws://192.168.29.195:9090"],
        json: true,
      });
      setConnection(connection);
    } catch (error) {
      console.error(error);
      setError(error);
    }
  }, []);

  const addOrigin = useCallback(
    (error, message) => {
      if (error) {
        setError(error);
      }

      const {
        msg: { latitude, longitude },
      } = jc.decode(message.data);

      const uniqueId = longitude.toString() + latitude.toString();

      if (uniqueIdMap.has(uniqueId)) return;

      uniqueIdMap.set(uniqueId, true);
      setOrigins((draft) => {
        draft.push([longitude, latitude]);
      });
    },
    [setOrigins]
  );

  const listenToOrigins = useCallback(async () => {
    try {
      const sub = natsConnection.subscribe("students.locations", {
        callback: addOrigin,
      });
      console.log(`listening for ${sub.getSubject()} requests...`);
    } catch (error) {
      console.error(error);
    }
  }, [addOrigin, natsConnection]);

  const sessionSetup = useCallback(() => {
    try {
      setViewport({
        longitude: UIET.longitude,
        latitude: UIET.latitude,
        zoom: 3,
        transitionInterpolator: new FlyToInterpolator({ speed: 1 }),
        transitionDuration: "auto",
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    sessionSetup();
    if (natsConnection) {
      listenToOrigins();
    } else {
      connectToNats();
    }
    return () => {
      natsConnection?.drain();
    };
  }, [sessionSetup, connectToNats, natsConnection, listenToOrigins]);

  return (
    <>
      <MapGL
        {...viewport}
        mapStyle="mapbox://styles/garvit2/cke5j2o2c1oej19qo843rhfi4"
        width="100vw"
        height="100vh"
        onViewportChange={setViewport}
        mapboxApiAccessToken={MAPBOX_TOKEN}
        ref={mapRef}
      >
        <FullscreenControl style={fullscreenControlStyle} />
        <NavigationControl style={navStyle} />
        <ScaleControl style={scaleControlStyle} />
        {origins &&
          origins.length > 0 &&
          origins.map((origin) => {
            const uniqueId = origin[0].toString() + origin[1].toString();
            return (
              <Arc
                key={uniqueId}
                originLng={origin[0]}
                originLat={origin[1]}
                uniqueId={uniqueId}
                color={getRandomColor(uniqueId)}
              />
            );
          })}
      </MapGL>
    </>
  );
}

export default App;
