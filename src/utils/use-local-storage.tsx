import {createContext, MutableRefObject, PropsWithChildren, useContext, useEffect, useRef, useState} from "react";

const LocalStorageContext = createContext<{
  lsRef: MutableRefObject<Record<string, any>>,
  subscribers: MutableRefObject<{
    nextId: number,
    map: Record<string, Record<number, (value: any) => void>>,
  }>
}>({} as any)

export function LocalStorageProvider(props: PropsWithChildren<{
}>) {
  const lsRef = useRef({});
  const subscribers = useRef({
    nextId: 0,
    map: {},
  });

  return <LocalStorageContext.Provider value={{ lsRef, subscribers }}>
    {props.children}
  </LocalStorageContext.Provider>
}

export function useLocalStorage<T>(key: string): [T | null, (value: T | null) => void] {
  const { lsRef, subscribers } = useContext(LocalStorageContext);

  function getKey(key: string) {
    let data = lsRef.current[key];
    if (data === undefined) {
      const value = localStorage.getItem(key);
      if (value) {
        data = JSON.parse(value);
      } else {
        data = null;
      }
      lsRef.current[key] = data;
    }
    return data;
  }

  function updateKey(key: string, value: T | null) {
    localStorage.setItem(key, JSON.stringify(value));
    lsRef.current[key] = value;

    const subs = subscribers.current.map[key];
    if (subs) {
      for (const id in subs) {
        subs[id](value);
      }
    }
  }

  const id = useRef(0);
  const [localData, setLocalData] = useState<T | null>(() => getKey(key));

  useEffect(() => {
    if (!subscribers.current.map[key]) {
      subscribers.current.map[key] = {};
    }

    id.current = subscribers.current.nextId++;
    subscribers.current.map[key][id.current] = setLocalData;

    return () => {
      delete subscribers.current.map[key][id.current];
      if (Object.keys(subscribers.current.map[key]).length == 0) {
        delete subscribers.current.map[key];
      }
    }
  }, [key]);

  return [localData, (newValue) => {
    updateKey(key, newValue);
  }]
}
