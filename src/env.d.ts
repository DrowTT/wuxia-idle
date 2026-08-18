/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

declare module 'odometer' {
  interface OdometerOptions {
    el: HTMLElement
    value: number
    format?: string
    theme?: string
    duration?: number
    animation?: string
  }

  export default class Odometer {
    constructor(options: OdometerOptions)
    update(value: number): void
    stopWatchingMutations?: () => void
  }
}
