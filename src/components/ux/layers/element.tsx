import {useRef, PropsWithChildren, useEffect, MouseEvent} from 'react'
import cn from 'classnames'

import styles from './styles.module.css'

export function ModalElement (props: PropsWithChildren<{
    title: string,
    onClose?: () => void,
    className?: string,
}>) {
    const modal = useRef<HTMLDivElement | null>(null);
    const clickStartedOnOutside = useRef(false);

    const onMouseDown = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
        if (e.target === modal.current) {
            clickStartedOnOutside.current = true;
        }
    }
    const onMouseUp = (e: globalThis.MouseEvent) => {
        if (clickStartedOnOutside.current) {
            if (e.target === modal.current) {
                props.onClose?.();
            } else {
                clickStartedOnOutside.current = false;
            }
        }
    }

    useEffect(() => {
        document.addEventListener('mouseup', onMouseUp);
        return () => {
            document.removeEventListener('mouseup', onMouseUp);
        }
    }, []);

    return (
        <div
          ref={modal}
          className={styles.modal}
          onMouseDown={onMouseDown}
        >
            <div className={cn(styles.modalInner, props.className)}>
                <div className={styles.modalTitle}>{props.title}</div>
                {props.children}
            </div>
        </div>
    )
}
