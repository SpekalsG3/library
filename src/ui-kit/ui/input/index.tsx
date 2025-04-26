import {ChangeEvent, useEffect, useState} from "react";
import cn from 'classnames'

import styles from './styles.module.css'

export enum EInputType {
    text = "text",
    number = "number",
    textarea = "textarea",
}

export function Input<
    T extends EInputType,
    V extends (
      T extends EInputType.number ? number : string
    )
> (props: {
    onChange: (value: V) => void,
    type: T,
    title?: string,
    tabIndex?: number,
    value?: V | null,
    placeholder?: V,
    min?: number,
    max?: number,
    className?: string,
    classNameTitle?: string,
    classNameInner?: string,
    autoFocus?: boolean,
}) {
    const [value, setValue] = useState(props.value);
    useEffect(() => {
        setValue(props.value);
    }, [props.value]);

    const onInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let data: (string) | (number | null);
        if (props.type != EInputType.number) {
            data = e.target.value as string;
        } else {
            const value = e.target.value.trim();
            if (value === "") {
                data = null;
            } else {
                const n = Number(value);
                if (isNaN(n)) {
                    // @ts-ignore
                    e.target.value = props.value ?? "";
                    return;
                }
                if (props.max && n > props.max) {
                    data = props.max;
                } else if (props.min && n < props.min) {
                    data = props.min;
                } else {
                    data = n;
                }
            }
        }
        setValue(data as V);
        props.onChange(data as V);
    }

    return (
        <div className={props.className}>
            {props.title && <div className={cn(styles.inputTitle, props.classNameTitle)}>{props.title}</div>}
            {props.type === EInputType.textarea
                ? <textarea
                    autoFocus={props.autoFocus}
                    tabIndex={props.tabIndex}
                    className={cn(styles.inputInner, props.classNameInner)}
                    placeholder={props.placeholder?.toString()}
                    onChange={onInputChange}
                    value={value ?? ""}
                >
                </textarea>
                : <input
                    autoFocus={props.autoFocus}
                    tabIndex={props.tabIndex}
                    placeholder={props.placeholder?.toString()}
                    className={cn(styles.inputInner, props.classNameInner)}
                    type="text"
                    value={value ?? ""}
                    onChange={onInputChange}
                    min={props.min}
                    max={props.max}
                />
            }
        </div>
    )
}
