import {KeyboardEvent, useRef, useState, BaseSyntheticEvent, ReactElement, useEffect} from "react";

import styles from './styles.module.css'

export function EnumInput (props: {
    onChange: (values: string[]) => void,
    values?: string[],
    title: string,
    className?: string,
}) {
    const [values, setValues] = useState(props.values ?? []);
    useEffect(() => {
        setValues(props.values ?? []);
    }, [props.values]);
    const lastElement = useRef<HTMLDivElement>(null);
    const inputElement = useRef<HTMLInputElement>(null);

    function addItem (value: string) {
        setValues((old) => {
            const values = [...old, value];
            props.onChange(values);
            return values;
        });
    }
    function removeItem (index: number) {
        setValues((old) => {
            const values = [...old];
            values.splice(index, 1);
            props.onChange(values);
            return values;
        });
    }

    const onEnter = (event: BaseSyntheticEvent) => {
        const data = event.target.value;
        if (data === "") {
            return;
        }

        addItem(data);
        event.target.value = "";
    }
    const onBackspace = (event: BaseSyntheticEvent) => {
        if (event.target.value === "" && lastElement.current !== null) {
            lastElement.current.focus();
        }
    }
    const onClickItem = (event: BaseSyntheticEvent) => {
        removeItem(Number(event.target.getAttribute("myindex")))
    }

    const onKeyDownInput = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case "Enter": onEnter(event); break;
            case "Backspace": onBackspace(event); break;
        }
    }
    const onKeyDownItem = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace") {
            // if keypressed on element then it exists
            // @ts-ignore
            removeItem(values.length - 1);
            // @ts-ignore
            inputElement.current.focus();
        }
    }

    return (
        <div className={props.className}>
            <div className={styles.inputTitle}>{props.title}</div>
            <div className={styles.inputBox}>
                {
                    values.map((el, i, arr) => (
                        <div
                            key={i}
                            {...{myindex: i}}
                            tabIndex={-1}
                            ref={(i === arr.length - 1) ? lastElement : null}
                            className={styles.inputItem}
                            onClick={onClickItem}
                            onKeyDown={onKeyDownItem}
                        >
                            {el}
                        </div>
                    ))
                }
                <input ref={inputElement} className={styles.inputInner} type="text" onKeyDown={onKeyDownInput}/>
            </div>
        </div>
    )
}
