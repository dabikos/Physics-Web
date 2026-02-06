/// <reference types="vite/client" />

declare module 'react-katex' {
    import { ComponentType } from 'react'

    interface MathProps {
        math?: string
        children?: string
        errorColor?: string
        renderError?: (error: Error) => React.ReactNode
    }

    export const InlineMath: ComponentType<MathProps>
    export const BlockMath: ComponentType<MathProps>
}
