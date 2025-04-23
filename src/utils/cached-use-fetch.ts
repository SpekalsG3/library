import {useEffect, useRef, useState} from "react";
import {IResSuccess} from "@api/types";
import {myRequest, MyRequestMethods} from "./request";

export type CachedUseFetchItem<T> = {
  current: T,
}

export type CachedUseFetchRef = object;

export class CachedUseFetch<K, T extends any> {
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
      const doFetch = async (key: K, url: URL) => {
        try {
          const res = await myRequest<undefined, IResSuccess<T>>(url.pathname, {
            method: MyRequestMethods.GET,
            query: url.searchParams,
          });

          this.cachedState.current.set(key, {
            // @ts-ignore
            current: res.body.data,
          });

          setData({});

        } catch (e) {
          console.log('e', e);
        }
      }

      const cached = this.getState();
      if (cached) {
        setData({});
      } else {
        const key = this.currentKey[0];
        void doFetch(key, getUrl(key));
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
