/// <reference types="vite/client" />

import { ApiExpose } from '../../shared/types'

declare global {
  interface Window {
    api: ApiExpose
    electron: any
  }
}
