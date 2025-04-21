import {useEffect, useRef, useState} from "react";
import { IRequestResponseSuccess } from "@api/types";

export type CachedUseFetchItem<T> = {
  current: T,
}

export type CachedUseFetchRef = object;

export class CachedUseFetch<K, T> {
  private readonly cachedState = useRef(new Map<K, CachedUseFetchItem<T>>());
  private readonly currentKey;
  private setCurrentData: (data: object) => void = () => {};

  constructor(defaultCacheKey: K) {
    this.currentKey = useState(defaultCacheKey);
  }

  useFetch(getUrl: (key: K) => URL): CachedUseFetchRef {
    const [data, setData] = useState<CachedUseFetchRef>({});
    this.setCurrentData = setData;

    useEffect(() => {
      const cached = this.getState();
      if (cached) {
        setData({});
      } else {
        fetch(getUrl(this.currentKey[0]))
          .then((r) => r.json())
          .then((r: IRequestResponseSuccess<T>) => {
            this.cachedState.current.set(this.currentKey[0], {
              current: r.data,
            });
            setData({});
          })
      }
    }, [this.currentKey[0]]);

    return data
  }

  getState(): CachedUseFetchItem<T> | undefined {
    return this.cachedState.current.get(this.currentKey[0]);
  }

  setCurrentKey(key: K) {
    this.currentKey[1](key);
  }

  getCurrentKey(): K {
    return this.currentKey[0];
  }

  updateStateByKey(key: K, value: ((old: T) => T)) {
    const state = this.cachedState.current.get(key);
    if (state) {
      state.current = value(state.current)
    }
  }

  updateCurrentState(value: ((old: T) => T)) {
    const state = this.getState();
    if (state) {
      state.current = value(state.current)
      this.setCurrentData({});
    }
  }
}
