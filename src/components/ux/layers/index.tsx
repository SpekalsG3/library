import {createContext, PropsWithChildren, useContext, useEffect, useRef} from "react";

interface LayersContextData {
  createLayer: (props: LayersState) => void
  removeLayer: () => void,
}

export const LayersContext = createContext<LayersContextData>({
  createLayer: () => {},
  removeLayer: () => {},
});

interface LayersState {
  keyHandler: (e: KeyboardEvent) => void,
  onEscape: null | (() => void),
}

export function KeybindingLayer(props: LayersState) {
  const { createLayer, removeLayer } = useContext(LayersContext);

  useEffect(() => {
    createLayer(props);
    return removeLayer;
  }, []);

  return <></>
}

export function LayersProvider ({
  children,
}: PropsWithChildren) {
  const layers = useRef<LayersState[]>([]);

  function bindLayer(layer?: LayersState) {
    if (layer?.keyHandler) {
      document.addEventListener("keydown", layer.keyHandler);
    }
  }
  function unbindLayer(layer?: LayersState) {
    if (layer?.keyHandler) {
      document.removeEventListener("keydown", layer.keyHandler);
    }
  }

  function globalModalKeyHandler(handleOther: (e: KeyboardEvent) => void) {
    return (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        layers.current.at(-1)?.onEscape!();
        return;
      }
      handleOther(e);
    }
  }

  function createLayer(props: LayersState): void {
    const state: LayersState = {
      keyHandler: props.onEscape
        ? globalModalKeyHandler(props.keyHandler)
        : props.keyHandler,
      onEscape: props.onEscape,
    }
    unbindLayer(layers.current.at(-1));
    layers.current.push(state);
    bindLayer(state);
  }

  function removeLayer(): void {
    if (layers.current.length === 0) {
      throw new Error('Tried removing baseLayer');
    }
    unbindLayer(layers.current.at(-1));
    layers.current.pop();
    bindLayer(layers.current.at(-1));
  }

  return <LayersContext.Provider value={{
    createLayer,
    removeLayer,
  }}>
    {children}
  </LayersContext.Provider>
}
