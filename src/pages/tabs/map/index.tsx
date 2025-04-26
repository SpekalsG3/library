import React, {useEffect, useRef, useState} from "react";
import {LayerGroup, MapContainer, TileLayer} from "react-leaflet";
import {
  DivIcon,
  LayerGroup as TLLayerGroup,
  LeafletMouseEvent,
  Map as TLMap,
  Marker,
  marker as TLCreateMarker,
} from "leaflet";
import cn from "classnames"
import "leaflet/dist/leaflet.css"

import styles from './styles.module.css';
import {ICON_BM} from "./icons";
import Button from "@ui-kit/ui/button";
import {EInputType, Input} from "@ui-kit/ui/input";
import {EnumInput} from "@ui-kit/ui/enum-input";
import {myRequest, MyRequestMethods} from "../../../utils/request";
import {IResSuccess} from "@api/types";
import {MapBookmarksDTO} from "../../../entities/map-bookmarks";
import {IMapBMEditReq} from "@api/map/bms/[id].p";
import {IMapBMCreateReq} from "@api/map/bms/index.p";

interface IBMElement {
  data: MapBookmarksDTO,
  localId: number,
  marker: Marker,
  iconEl: HTMLElement,
  isLocal: boolean,
}

export default function MapPage() {
  const mapRef = useRef<TLMap>(null as any); // always set in handlers
  const bmsLayerRef = useRef<TLLayerGroup>(null as any);
  const localIdSeq = useRef(0);
  const [bmCurrent, setBmCurrent] = useState<IBMElement | null>(null);
  const bmCurrentRef = useRef(bmCurrent);

  const bmsRef = useRef<Record<number, IBMElement>>({});

  useEffect(() => {
    async function callGet() {
      try {
        const res = await myRequest<undefined, IResSuccess<MapBookmarksDTO[]>>('/api/map/bms', {
          method: MyRequestMethods.GET,
        });

        const data = res.body.data;
        for (const el of data) {
          createBm({
            isLocal: false,
          }, el);
        }
      } catch (e) {
        console.error('Failed fetch bookmarks', e);
      }
    }
    void callGet();
  }, []);

  function onMarkerClick(localId: number) {
    return (e: LeafletMouseEvent) => {
      if (bmCurrentRef.current) {
        closeBmEdit();
      }
      bmsRef.current[localId].iconEl = e.target._icon;
      bmCurrentRef.current = bmsRef.current[localId];
      setBmCurrent(bmCurrentRef.current);
      bmCurrentRef.current.iconEl.classList.add(styles.bmSelected);
    }
  }

  function createBm(
    opts: {
      isLocal: boolean,
    },
    bm: MapBookmarksDTO,
  ): number {
    const icon = new DivIcon({
      html: ICON_BM("green"),
      className: styles.bm,
    });
    const marker = TLCreateMarker({
      lng: bm.lng,
      lat: bm.lat,
    }, {
      icon: icon,
    });

    const localId = localIdSeq.current++;
    bmsRef.current[localId] = {
      localId: localId,
      data: bm,
      marker: marker,
      iconEl: undefined as any, // unknown until mounted, will be set onclick
      isLocal: opts.isLocal,
    };

    marker
      .addEventListener("click", onMarkerClick(localId))
      .addTo(bmsLayerRef.current);

    return localId;
  }

  function closeBmEdit() {
    async function callPut(
      localId: number,
      isLocal: boolean,
      data: MapBookmarksDTO,
    ) {
      const dto = {
        lat: data.lat,
        lng: data.lng,
        notes: data.notes,
        title: data.title,
        tags: data.tags,
      };
      try {
        if (isLocal) {
          const res = await myRequest<IMapBMCreateReq, IResSuccess<number>>(`/api/map/bms`, {
            method: MyRequestMethods.POST,
            body: {
              item: dto,
            },
          });
          bmsRef.current[localId].data.id = res.body.data;
          bmsRef.current[localId].isLocal = false;
        } else {
          await myRequest<IMapBMEditReq, unknown>(`/api/map/bms/${data.id}`, {
            method: MyRequestMethods.PUT,
            body: {
              item: dto,
            },
          });
        }
      } catch (e) {
        console.error(`Failed to save bookmark (isLocal=${isLocal}):`, e);
      }
    }

    // save
    void callPut(
      bmCurrentRef.current!.localId,
      bmCurrentRef.current!.isLocal,
      bmCurrentRef.current!.data,
    );
    bmsRef.current[bmCurrentRef.current!.localId].data = bmCurrentRef.current!.data;
    // close
    bmCurrentRef.current!.iconEl.classList.remove(styles.bmSelected);
    bmCurrentRef.current = null;
    setBmCurrent(null);
  }
  function deleteActiveBm() {
    async function callDelete(
      data: MapBookmarksDTO,
    ) {
      try {
        await myRequest(`/api/map/bms/${data.id}`, {
          method: MyRequestMethods.DELETE,
        });
      } catch (e) {
        console.error('Failed to Delete bookmark:', e);
      }
    }

    void callDelete(
      bmCurrentRef.current!.data,
    );

    bmsRef.current[bmCurrentRef.current!.localId].marker.remove();
    delete bmsRef.current[bmCurrentRef.current!.localId];
    bmCurrentRef.current = null;
    setBmCurrent(null);
  }

  function onMapClick(e: LeafletMouseEvent) {
    const localId = createBm({
      isLocal: true,
    }, {
      id: null as any, // unused when isLocal=true
      title: `${e.latlng.lat.toFixed(3)},${e.latlng.lng.toFixed(3)}`,
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      notes: '',
      tags: [],
      created_at: '',
      updated_at: '',
    });
    bmsRef.current[localId].marker.fire("click");
  }

  function addListeners() {
    mapRef.current.addEventListener("click", onMapClick);
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
