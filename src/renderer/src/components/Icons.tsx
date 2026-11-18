import type { JSX } from 'react'
import type { ReactNode, SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 16, children, ...rest }: P & { children: ReactNode }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IFolder = (p: P): JSX.Element => (
  <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>
)
export const IRefresh = (p: P): JSX.Element => (
  <Svg {...p}><path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4" /></Svg>
)
export const ISearch = (p: P): JSX.Element => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Svg>
)
export const IGrid = (p: P): JSX.Element => (
  <Svg {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></Svg>
)
export const IList = (p: P): JSX.Element => (
  <Svg {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></Svg>
)
export const IUndo = (p: P): JSX.Element => (
  <Svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Svg>
)
export const ISettings = (p: P): JSX.Element => (
  <Svg {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Svg>
)
export const IClock = (p: P): JSX.Element => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
)
export const ICalendar = (p: P): JSX.Element => (
  <Svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Svg>
)
export const IPin = (p: P): JSX.Element => (
  <Svg {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></Svg>
)
export const ITrash = (p: P): JSX.Element => (
  <Svg {...p}><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" /></Svg>
)
export const IDownload = (p: P): JSX.Element => (
  <Svg {...p}><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></Svg>
)
export const IX = (p: P): JSX.Element => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
)
export const ICheck = (p: P): JSX.Element => (
  <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
)
export const IChevronDown = (p: P): JSX.Element => (
  <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
)
export const IChevronLeft = (p: P): JSX.Element => (
  <Svg {...p}><path d="m15 6-6 6 6 6" /></Svg>
)
export const IChevronRight = (p: P): JSX.Element => (
  <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
)
export const IWarn = (p: P): JSX.Element => (
  <Svg {...p}><path d="M12 3.8 2.8 19.5h18.4z" /><path d="M12 10v4.2M12 17.2v.1" /></Svg>
)
export const IError = (p: P): JSX.Element => (
  <Svg {...p}><path d="M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2z" /><path d="M12 7.8v5M12 16.2v.1" /></Svg>
)
export const IStar = ({ filled, ...p }: P & { filled?: boolean }): JSX.Element => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" /></Svg>
)
export const ICamera = (p: P): JSX.Element => (
  <Svg {...p}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.3" /></Svg>
)
export const IAperture = (p: P): JSX.Element => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M14.3 3.8 9 13M19.5 8.6H9.3M18.7 16 13.8 7.3M9.7 20.2 15 11M4.5 15.4h10.2M5.3 8l4.9 8.7" /></Svg>
)
export const ITag = (p: P): JSX.Element => (
  <Svg {...p}><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.1 6.1a1.5 1.5 0 0 1-2.1 0z" /><circle cx="8" cy="8" r="1.4" /></Svg>
)
export const ICopy = (p: P): JSX.Element => (
  <Svg {...p}><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></Svg>
)
export const IWand = (p: P): JSX.Element => (
  <Svg {...p}><path d="m4 20 11-11M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" /></Svg>
)
export const ILayers = (p: P): JSX.Element => (
  <Svg {...p}><path d="m12 4 8.5 4.5L12 13 3.5 8.5z" /><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" /></Svg>
)
export const IExternal = (p: P): JSX.Element => (
  <Svg {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></Svg>
)
export const IPlus = (p: P): JSX.Element => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
export const IMore = (p: P): JSX.Element => (
  <Svg {...p}><circle cx="5.5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18.5" cy="12" r="1.2" /></Svg>
)
export const IFilter = (p: P): JSX.Element => (
  <Svg {...p}><path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8z" /></Svg>
)
export const IRevert = (p: P): JSX.Element => (
  <Svg {...p}><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" /><path d="M4.5 4.5V9H9" /></Svg>
)
export const IImage = (p: P): JSX.Element => (
  <Svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.7" /><path d="m20.5 16-5-5-8.5 8.5" /></Svg>
)
export const IBolt = (p: P): JSX.Element => (
  <Svg {...p}><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" /></Svg>
)
export const ISync = (p: P): JSX.Element => (
  <Svg {...p}><path d="M5 9h11.5l-3-3M19 15H7.5l3 3" /></Svg>
)
