import type { ExifyApi } from '../shared/types'

declare global {
  interface Window {
    exify: ExifyApi
  }
}

export {}
