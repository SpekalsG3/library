import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css"

import styles from './styles.module.css';

export default function MapPage() {
  return <div className={styles.content}>
    <MapContainer
      className={styles.map}
      center={[51.505, -0.09]}
      zoom={11}
      scrollWheelZoom={true}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  </div>
}
