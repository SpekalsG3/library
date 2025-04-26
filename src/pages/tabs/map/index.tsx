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

interface IBookmark {
  id: number,
  title: string,
  notes: string,
  tags: string[],
}
interface IBMElement {
  data: IBookmark,
  marker: Marker,
  iconEl: HTMLElement,
}

export default function MapPage() {
  const mapRef = useRef<TLMap>(null as any); // always set in handlers
  const bmsLayerRef = useRef<TLLayerGroup>(null as any);
  const nextIdRef = useRef(0);
  const [bmCurrent, setBmCurrent] = useState<IBMElement | null>(null);
  const bmCurrentRef = useRef(bmCurrent);

  const bmsRef = useRef<Record<number, IBMElement>>({});

  function onMarkerClick(id: number) {
    return (e: LeafletMouseEvent) => {
      if (bmCurrentRef.current) {
        closeBmEdit();
      }
      bmsRef.current[id].iconEl = e.target._icon;
      bmCurrentRef.current = bmsRef.current[id];
      setBmCurrent(bmCurrentRef.current);
      bmCurrentRef.current.iconEl.classList.add(styles.bmSelected);
    }
  }
  function closeBmEdit() {
    setBmCurrent(null);
    bmCurrentRef.current!.iconEl.classList.remove(styles.bmSelected);
    bmCurrentRef.current = null;
  }
  function deleteActiveBm() {
    setBmCurrent(null);
    bmsRef.current[bmCurrentRef.current!.data.id].marker.remove();
    delete bmsRef.current[bmCurrentRef.current!.data.id];
  }
  function saveActiveBm() {
    bmsRef.current[bmCurrentRef.current!.data.id].data = bmCurrentRef.current!.data;
  }

  function createBm(e: LeafletMouseEvent) {
    const icon = new DivIcon({
      html: ICON_BM("green"),
      className: styles.bm,
    });
    const marker = TLCreateMarker(e.latlng, {
      icon: icon,
    });

    const id = nextIdRef.current++;
    bmsRef.current[id] = {
      data: {
        id: id,
        title: `${e.latlng.lat.toFixed(3)},${e.latlng.lng.toFixed(3)}`,
        notes: '',
        tags: [],
      },
      marker: marker,
      iconEl: undefined as any, // unknown until mounted, will be set onclick
    };

    marker
      .addEventListener("click", onMarkerClick(id))
      .addTo(bmsLayerRef.current);
  }

  function addListeners() {
    mapRef.current.addEventListener("click", createBm);
  }

  return <div className={styles.content}>
    {bmCurrent && <div className={styles.edit}>
      <Button className={styles.editClose} text={"x"} onClick={closeBmEdit} />
      <Input
        className={styles.editTitle}
        classNameInner={styles.editTitleInput}
        type={EInputType.text}
        value={bmCurrent.data.title}
        onChange={v => bmCurrentRef.current!.data.title = v}
      />
      <EnumInput
        title={"Tags"}
        className={cn(styles.editField, styles.editTags)}
        values={bmCurrent.data.tags}
        onChange={v => bmCurrentRef.current!.data.tags = v}
      />
      <Input
        title={"Notes"}
        className={styles.editField}
        type={EInputType.textarea}
        value={bmCurrent.data.notes}
        onChange={v => bmCurrentRef.current!.data.notes = v}
      />
      <Button className={styles.editField} onClick={saveActiveBm} text={"Save"} />
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
