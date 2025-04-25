import React, {useRef, useState} from "react";
import {MapContainer, LayerGroup, TileLayer} from "react-leaflet";
import {
  DivIcon,
  LayerGroup as TLLayerGroup,
  LeafletMouseEvent,
  Map as TLMap, Marker,
  marker as TLCreateMarker,
} from "leaflet";
import cn from "classnames"
import "leaflet/dist/leaflet.css"

import styles from './styles.module.css';
import {ICON_BM} from "./icons";
import Button from "@ui-kit/ui/button";
import {EInputType, Input} from "@ui-kit/ui/input";
import {EnumInput} from "@ui-kit/ui/enum-input";

interface IBMEdit {
  notes?: string,
  tags?: string[],
}

export default function MapPage() {
  const mapRef = useRef<TLMap>(null as any); // always set in handlers
  const bmsLayerRef = useRef<TLLayerGroup>(null as any);
  const bmsListRef = useRef<Record<number, Marker>>({});
  const nextIdRef = useRef(0);
  const [openedBM, setOpenedBM] = useState<number | null>(null);
  const bmEditRef = useRef<IBMEdit>({});

  function onMarkerClick(id: number) {
    return (e: LeafletMouseEvent) => {
      setOpenedBM(id);
    }
  }
  function closeBmEdit() {
    bmEditRef.current = {};
    setOpenedBM(null);
  }
  function deleteActiveBm() {
    console.log(openedBM);
    bmsListRef.current[openedBM!].remove();
    delete bmsListRef.current[openedBM!];
    bmEditRef.current = {};
    setOpenedBM(null);
  }

  function onMapClick(e: LeafletMouseEvent) {
    const marker = TLCreateMarker(e.latlng, {
      icon: new DivIcon({
        html: ICON_BM("green"),
        className: styles.bm,
      }),
    });

    const id = nextIdRef.current++;
    bmsListRef.current[id] = marker;

    marker
      .addEventListener("click", onMarkerClick(id))
      .addTo(bmsLayerRef.current);
  }

  function addListeners() {
    mapRef.current.addEventListener("click", onMapClick);
  }

  return <div className={styles.content}>
    {openedBM !== null && <div className={styles.edit}>
      <Button className={styles.editClose} text={"x"} onClick={closeBmEdit} />
      <div className={styles.editTitle}>Edit bookmark</div>
      <EnumInput className={cn(styles.editField, styles.editTags)} title={"Tags"} onChange={v => bmEditRef.current.tags = v} />
      <Input className={styles.editField} type={EInputType.textarea} title={"Notes"} onChange={v => bmEditRef.current.notes = v} />
      <Button className={styles.editField} onClick={() => {}} text={"Save"} />
      <Button className={cn(styles.editField, styles.editHighlight)} onClick={deleteActiveBm} text={"Delete"} />
    </div>}

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
      <LayerGroup ref={bmsLayerRef} />
    </MapContainer>
  </div>
}
