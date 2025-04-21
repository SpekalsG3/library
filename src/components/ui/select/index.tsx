import {ChangeEvent, HTMLInputTypeAttribute, useState} from "react";

import styles from './styles.module.css'

export function Select<T extends string> (props: {
    onChange: (value: T) => void,
    value?: T,
    title: string,
    options: {
        value: T,
        label: string,
    }[],
    className?: string
    tabIndex?: number,
    autoFocus?: boolean,
}) {
    const [value, setValue] = useState(props.value)

    const onInputChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const data = e.target.value as T;
        setValue(data);
        props.onChange(data);
    }

    return (
        <div className={props.className}>
            <label>
                <div className={styles.inputTitle}>{props.title}</div>
                <select
                  autoFocus={props.autoFocus}
                  tabIndex={props.tabIndex}
                  value={value as string}
                  className={styles.inputInner}
                  onChange={onInputChange}
                >
                    {props.options.map((o, i) => {
                        return <option key={i} value={o.value}>{o.label}</option>
                    })}
                </select>
            </label>
        </div>
    )
}
