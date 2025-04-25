import React, {useRef} from "react";
import {MapContainer, LayerGroup, TileLayer} from "react-leaflet";
import {
  DivIcon,
  LayerGroup as TLLayerGroup,
  LeafletMouseEvent,
  Map as TLMap, marker,
} from "leaflet";
import "leaflet/dist/leaflet.css"

import styles from './styles.module.css';
import {ICON_BM} from "./icons";

export default function MapPage() {
  const mapRef = useRef<TLMap>(null as any); // always set in handlers
  const bmsRef = useRef<TLLayerGroup>(null as any);

  function onMarkerClick(e: LeafletMouseEvent) {
  }

  function onMapClick(e: LeafletMouseEvent) {
    marker(e.latlng, {
      icon: new DivIcon({
        html: ICON_BM("green"),
        className: styles.bm,
      }),
    })
      .addEventListener("click", onMarkerClick)
      .addTo(bmsRef.current);
  }

  function addListeners() {
    mapRef.current.addEventListener("click", onMapClick);
  }

  return <div className={styles.content}>
    <MapContainer
      className={styles.map}
      center={[51.505, -0.09]}
      zoom={11}
      scrollWheelZoom={true}
      attributionControl={false}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{
          load: addListeners,
        }}
      />
      <LayerGroup ref={bmsRef} />
    </MapContainer>
  </div>
}
