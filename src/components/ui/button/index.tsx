import cn from 'classnames'

import styles from './styles.module.css'

export default function Button (props: {
    text: string,
    onClick: () => void,
    className?: string
}) {
    return <div
        onClick={props.onClick}
        className={cn(styles.button, props.className)}
    >
        {props.text}
    </div>
}
