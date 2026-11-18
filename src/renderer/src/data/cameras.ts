/**
 * Camera database. `model` is the exact string the camera writes to EXIF where
 * known (so Lightroom/Capture One lens & camera profiles still match); `label`
 * is the friendly marketing name shown in the dropdown.
 */

export interface CameraModel {
  make: string
  model: string
  label?: string
  mount: string
  film?: boolean
  brand: string
}

export interface MountInfo {
  name: string
  /** Crop factor relative to 35mm full frame. */
  crop: number
  /** Lens mounts that physically fit this body natively. */
  accepts?: string[]
}

export const MOUNTS: Record<string, MountInfo> = {
  RF: { name: 'Canon RF', crop: 1, accepts: ['RF', 'RF-S', 'EF', 'EF-S'] },
  'RF-S': { name: 'Canon RF (APS-C)', crop: 1.6, accepts: ['RF', 'RF-S', 'EF', 'EF-S'] },
  EF: { name: 'Canon EF', crop: 1, accepts: ['EF'] },
  'EF-S': { name: 'Canon EF-S', crop: 1.6, accepts: ['EF', 'EF-S'] },
  'EF-H': { name: 'Canon EF (APS-H)', crop: 1.3, accepts: ['EF'] },
  'EF-C': { name: 'Canon EF (early APS-C, no EF-S)', crop: 1.6, accepts: ['EF'] },
  'EF-M': { name: 'Canon EF-M', crop: 1.6, accepts: ['EF-M'] },
  FD: { name: 'Canon FD', crop: 1, accepts: ['FD'] },
  Z: { name: 'Nikon Z', crop: 1, accepts: ['Z', 'Z-DX', 'F', 'F-DX'] },
  'Z-DX': { name: 'Nikon Z (DX)', crop: 1.5, accepts: ['Z', 'Z-DX', 'F', 'F-DX'] },
  F: { name: 'Nikon F', crop: 1, accepts: ['F', 'F-DX'] },
  'F-DX': { name: 'Nikon F (DX)', crop: 1.5, accepts: ['F', 'F-DX'] },
  E: { name: 'Sony E (FE)', crop: 1, accepts: ['E', 'E-APSC'] },
  'E-APSC': { name: 'Sony E (APS-C)', crop: 1.5, accepts: ['E', 'E-APSC'] },
  A: { name: 'Minolta / Sony A', crop: 1, accepts: ['A'] },
  X: { name: 'Fujifilm X', crop: 1.5, accepts: ['X'] },
  GF: { name: 'Fujifilm G', crop: 0.79, accepts: ['GF'] },
  L: { name: 'L-Mount', crop: 1, accepts: ['L'] },
  'L-APSC': { name: 'L-Mount (APS-C)', crop: 1.5, accepts: ['L'] },
  MFT: { name: 'Micro Four Thirds', crop: 2, accepts: ['MFT'] },
  K: { name: 'Pentax K', crop: 1, accepts: ['K', 'K-APSC'] },
  'K-APSC': { name: 'Pentax K (APS-C)', crop: 1.5, accepts: ['K', 'K-APSC'] },
  M: { name: 'Leica M', crop: 1, accepts: ['M'] },
  XCD: { name: 'Hasselblad XCD', crop: 0.79, accepts: ['XCD'] },
  OM: { name: 'Olympus OM', crop: 1, accepts: ['OM'] },
  MD: { name: 'Minolta SR/MD', crop: 1, accepts: ['MD'] },
  M42: { name: 'M42 screw', crop: 1, accepts: ['M42'] },
  CY: { name: 'Contax/Yashica', crop: 1, accepts: ['CY'] },
  G: { name: 'Contax G', crop: 1, accepts: ['G'] },
  R: { name: 'Leica R', crop: 1, accepts: ['R'] },
  P645: { name: '645 medium format', crop: 0.62 },
  P66: { name: '6×6 medium format', crop: 0.55 },
  P67: { name: '6×7 medium format', crop: 0.5 },
  P69: { name: '6×9 medium format', crop: 0.43 },
  Fixed: { name: 'Fixed lens', crop: 1 },
  'Fixed-1in': { name: 'Fixed lens (1")', crop: 2.7 },
  'Fixed-APSC': { name: 'Fixed lens (APS-C)', crop: 1.5 },
  'Fixed-FF': { name: 'Fixed lens (full frame)', crop: 1 },
  Phone: { name: 'Phone', crop: 0 },
  Drone: { name: 'Drone / action', crop: 0 }
}

type Row = [model: string, mount: string, label?: string]

interface BrandDef {
  brand: string
  make: string
  digital: Row[]
  film?: Row[]
  /** EXIF Make used for this brand's film bodies, if different. */
  filmMake?: string
}

const BRANDS: BrandDef[] = [
  {
    brand: 'Canon',
    make: 'Canon',
    digital: [
      // ---- EOS R (full frame, RF)
      ['Canon EOS R1', 'RF'], ['Canon EOS R3', 'RF'], ['Canon EOS R5 Mark II', 'RF'], ['Canon EOS R5', 'RF'],
      ['Canon EOS R5 C', 'RF'], ['Canon EOS R6 Mark III', 'RF'], ['Canon EOS R6 Mark II', 'RF'], ['Canon EOS R6', 'RF'],
      ['Canon EOS R8', 'RF'], ['Canon EOS RP', 'RF'], ['Canon EOS Ra', 'RF'], ['Canon EOS R', 'RF'],
      ['Canon EOS C70', 'RF'], ['Canon EOS C80', 'RF'], ['Canon EOS C400', 'RF'],
      // ---- EOS R (APS-C, RF-S)
      ['Canon EOS R7', 'RF-S'], ['Canon EOS R10', 'RF-S'], ['Canon EOS R50', 'RF-S'], ['Canon EOS R50 V', 'RF-S'],
      ['Canon EOS R100', 'RF-S'],
      // ---- EOS-1D series (APS-H 1.3x and full frame)
      ['Canon EOS-1D X Mark III', 'EF'], ['Canon EOS-1D X Mark II', 'EF'], ['Canon EOS-1D X', 'EF'], ['Canon EOS-1D C', 'EF'],
      ['Canon EOS-1Ds Mark III', 'EF'], ['Canon EOS-1Ds Mark II', 'EF'], ['Canon EOS-1Ds', 'EF'],
      ['Canon EOS-1D Mark IV', 'EF-H'], ['Canon EOS-1D Mark III', 'EF-H'], ['Canon EOS-1D Mark II N', 'EF-H'],
      ['Canon EOS-1D Mark II', 'EF-H'], ['Canon EOS-1D', 'EF-H'],
      // ---- Full frame EF
      ['Canon EOS 5D Mark IV', 'EF'], ['Canon EOS 5D Mark III', 'EF'], ['Canon EOS 5D Mark II', 'EF'], ['Canon EOS 5D', 'EF'],
      ['Canon EOS 5DS R', 'EF'], ['Canon EOS 5DS', 'EF'], ['Canon EOS 6D Mark II', 'EF'], ['Canon EOS 6D', 'EF'],
      // ---- APS-C EF-S (prosumer)
      ['Canon EOS 7D Mark II', 'EF-S'], ['Canon EOS 7D', 'EF-S'], ['Canon EOS 90D', 'EF-S'], ['Canon EOS 80D', 'EF-S'],
      ['Canon EOS 70D', 'EF-S'], ['Canon EOS 60Da', 'EF-S'], ['Canon EOS 60D', 'EF-S'], ['Canon EOS 50D', 'EF-S'],
      ['Canon EOS 40D', 'EF-S'], ['Canon EOS 30D', 'EF-S'], ['Canon EOS 20Da', 'EF-S'], ['Canon EOS 20D', 'EF-S'],
      // ---- Early APS-C (no EF-S support)
      ['Canon EOS 10D', 'EF-C'], ['Canon EOS D60', 'EF-C'], ['Canon EOS D30', 'EF-C'],
      // ---- Rebel / Kiss / xxxD (EU name, US name, JP name)
      ['Canon EOS 77D', 'EF-S'], ['Canon EOS 9000D', 'EF-S', 'Canon EOS 9000D (77D, Japan)'],
      ['Canon EOS 850D', 'EF-S'], ['Canon EOS Rebel T8i', 'EF-S', 'Canon EOS Rebel T8i (850D)'], ['Canon EOS Kiss X10i', 'EF-S', 'Canon EOS Kiss X10i (850D)'],
      ['Canon EOS 800D', 'EF-S'], ['Canon EOS REBEL T7i', 'EF-S', 'Canon EOS Rebel T7i (800D)'], ['Canon EOS Kiss X9i', 'EF-S', 'Canon EOS Kiss X9i (800D)'],
      ['Canon EOS 760D', 'EF-S'], ['Canon EOS REBEL T6s', 'EF-S', 'Canon EOS Rebel T6s (760D)'], ['Canon EOS 8000D', 'EF-S', 'Canon EOS 8000D (760D, Japan)'],
      ['Canon EOS 750D', 'EF-S'], ['Canon EOS REBEL T6i', 'EF-S', 'Canon EOS Rebel T6i (750D)'], ['Canon EOS Kiss X8i', 'EF-S', 'Canon EOS Kiss X8i (750D)'],
      ['Canon EOS 700D', 'EF-S'], ['Canon EOS REBEL T5i', 'EF-S', 'Canon EOS Rebel T5i (700D)'], ['Canon EOS Kiss X7i', 'EF-S', 'Canon EOS Kiss X7i (700D)'],
      ['Canon EOS 650D', 'EF-S'], ['Canon EOS REBEL T4i', 'EF-S', 'Canon EOS Rebel T4i (650D)'], ['Canon EOS Kiss X6i', 'EF-S', 'Canon EOS Kiss X6i (650D)'],
      ['Canon EOS 600D', 'EF-S'], ['Canon EOS REBEL T3i', 'EF-S', 'Canon EOS Rebel T3i (600D)'], ['Canon EOS Kiss X5', 'EF-S', 'Canon EOS Kiss X5 (600D)'],
      ['Canon EOS 550D', 'EF-S'], ['Canon EOS REBEL T2i', 'EF-S', 'Canon EOS Rebel T2i (550D)'], ['Canon EOS Kiss X4', 'EF-S', 'Canon EOS Kiss X4 (550D)'],
      ['Canon EOS 500D', 'EF-S'], ['Canon EOS REBEL T1i', 'EF-S', 'Canon EOS Rebel T1i (500D)'], ['Canon EOS Kiss X3', 'EF-S', 'Canon EOS Kiss X3 (500D)'],
      ['Canon EOS 450D', 'EF-S'], ['Canon EOS REBEL XSi', 'EF-S', 'Canon EOS Rebel XSi (450D)'], ['Canon EOS Kiss X2', 'EF-S', 'Canon EOS Kiss X2 (450D)'],
      ['Canon EOS 400D DIGITAL', 'EF-S', 'Canon EOS 400D'], ['Canon EOS DIGITAL REBEL XTi', 'EF-S', 'Canon EOS Digital Rebel XTi (400D)'], ['Canon EOS Kiss Digital X', 'EF-S', 'Canon EOS Kiss Digital X (400D)'],
      ['Canon EOS 350D DIGITAL', 'EF-S', 'Canon EOS 350D'], ['Canon EOS DIGITAL REBEL XT', 'EF-S', 'Canon EOS Digital Rebel XT (350D)'], ['Canon EOS Kiss Digital N', 'EF-S', 'Canon EOS Kiss Digital N (350D)'],
      ['Canon EOS 300D DIGITAL', 'EF-S', 'Canon EOS 300D'], ['Canon EOS DIGITAL REBEL', 'EF-S', 'Canon EOS Digital Rebel (300D)'], ['Canon EOS Kiss Digital', 'EF-S', 'Canon EOS Kiss Digital (300D)'],
      ['Canon EOS 250D', 'EF-S'], ['Canon EOS Rebel SL3', 'EF-S', 'Canon EOS Rebel SL3 (250D)'], ['Canon EOS Kiss X10', 'EF-S', 'Canon EOS Kiss X10 (250D)'],
      ['Canon EOS 200D', 'EF-S'], ['Canon EOS REBEL SL2', 'EF-S', 'Canon EOS Rebel SL2 (200D)'], ['Canon EOS Kiss X9', 'EF-S', 'Canon EOS Kiss X9 (200D)'],
      ['Canon EOS 100D', 'EF-S'], ['Canon EOS REBEL SL1', 'EF-S', 'Canon EOS Rebel SL1 (100D)'], ['Canon EOS Kiss X7', 'EF-S', 'Canon EOS Kiss X7 (100D)'],
      ['Canon EOS 4000D', 'EF-S'], ['Canon EOS REBEL T100', 'EF-S', 'Canon EOS Rebel T100 (4000D)'],
      ['Canon EOS 2000D', 'EF-S'], ['Canon EOS REBEL T7', 'EF-S', 'Canon EOS Rebel T7 (2000D)'], ['Canon EOS Kiss X90', 'EF-S', 'Canon EOS Kiss X90 (2000D)'],
      ['Canon EOS 1300D', 'EF-S'], ['Canon EOS Rebel T6', 'EF-S', 'Canon EOS Rebel T6 (1300D)'], ['Canon EOS Kiss X80', 'EF-S', 'Canon EOS Kiss X80 (1300D)'],
      ['Canon EOS 1200D', 'EF-S'], ['Canon EOS REBEL T5', 'EF-S', 'Canon EOS Rebel T5 (1200D)'], ['Canon EOS Kiss X70', 'EF-S', 'Canon EOS Kiss X70 (1200D)'],
      ['Canon EOS 1100D', 'EF-S'], ['Canon EOS REBEL T3', 'EF-S', 'Canon EOS Rebel T3 (1100D)'], ['Canon EOS Kiss X50', 'EF-S', 'Canon EOS Kiss X50 (1100D)'],
      ['Canon EOS 1000D', 'EF-S'], ['Canon EOS REBEL XS', 'EF-S', 'Canon EOS Rebel XS (1000D)'], ['Canon EOS Kiss F', 'EF-S', 'Canon EOS Kiss F (1000D)'],
      // ---- EOS M (EF-M)
      ['Canon EOS M50m2', 'EF-M', 'Canon EOS M50 Mark II'], ['Canon EOS Kiss M2', 'EF-M', 'Canon EOS Kiss M2 (M50 II)'],
      ['Canon EOS M50', 'EF-M'], ['Canon EOS Kiss M', 'EF-M', 'Canon EOS Kiss M (M50)'], ['Canon EOS M6 Mark II', 'EF-M'],
      ['Canon EOS M6', 'EF-M'], ['Canon EOS M5', 'EF-M'], ['Canon EOS M3', 'EF-M'], ['Canon EOS M200', 'EF-M'],
      ['Canon EOS M100', 'EF-M'], ['Canon EOS M10', 'EF-M'], ['Canon EOS M2', 'EF-M'], ['Canon EOS M', 'EF-M'],
      // ---- PowerShot
      ['Canon PowerShot V1', 'Fixed-1in'], ['Canon PowerShot V10', 'Fixed-1in'], ['Canon PowerShot G7 X Mark III', 'Fixed-1in'],
      ['Canon PowerShot G7 X Mark II', 'Fixed-1in'], ['Canon PowerShot G7 X', 'Fixed-1in'], ['Canon PowerShot G5 X Mark II', 'Fixed-1in'],
      ['Canon PowerShot G9 X Mark II', 'Fixed-1in'], ['Canon PowerShot G1 X Mark III', 'Fixed-APSC'],
      ['Canon PowerShot G1 X Mark II', 'Fixed'], ['Canon PowerShot G16', 'Fixed'], ['Canon PowerShot S120', 'Fixed'],
      ['Canon PowerShot SX70 HS', 'Fixed'], ['Canon PowerShot SX740 HS', 'Fixed'], ['Canon PowerShot SX620 HS', 'Fixed'],
      ['Canon IXUS 285 HS', 'Fixed'], ['Canon PowerShot ELPH 360 HS', 'Fixed']
    ],
    film: [
      // ---- EOS film (EF)
      ['Canon EOS-1V', 'EF'], ['Canon EOS-1V HS', 'EF'], ['Canon EOS-1N', 'EF'], ['Canon EOS-1N RS', 'EF'], ['Canon EOS-1', 'EF'],
      ['Canon EOS-3', 'EF'], ['Canon EOS 5 / A2E', 'EF'], ['Canon EOS 30 / Elan 7E', 'EF'], ['Canon EOS 30V / Elan 7NE', 'EF'],
      ['Canon EOS 33 / Elan 7', 'EF'], ['Canon EOS 50E / Elan IIE', 'EF'], ['Canon EOS 100 / Elan', 'EF'],
      ['Canon EOS 300V / Rebel Ti', 'EF'], ['Canon EOS 300X / Rebel T2', 'EF'], ['Canon EOS 300 / Rebel 2000', 'EF'],
      ['Canon EOS 500N / Rebel G', 'EF'], ['Canon EOS 3000V / Rebel K2', 'EF'], ['Canon EOS 620', 'EF'], ['Canon EOS 650', 'EF'],
      ['Canon EOS RT', 'EF'], ['Canon EOS 10', 'EF'], ['Canon EOS IX', 'EF'],
      // ---- FD / FL manual focus
      ['Canon AE-1', 'FD'], ['Canon AE-1 Program', 'FD'], ['Canon A-1', 'FD'], ['Canon AV-1', 'FD'], ['Canon AT-1', 'FD'],
      ['Canon AL-1', 'FD'], ['Canon F-1', 'FD'], ['Canon New F-1', 'FD'], ['Canon FTb', 'FD'], ['Canon FTb-N', 'FD'],
      ['Canon EF (1973)', 'FD'], ['Canon T50', 'FD'], ['Canon T70', 'FD'], ['Canon T90', 'FD'], ['Canon FT QL', 'FD'],
      // ---- Rangefinders & compacts
      ['Canon Canonet QL17 GIII', 'Fixed'], ['Canon Canonet QL19', 'Fixed'], ['Canon Canonet 28', 'Fixed'], ['Canon 7', 'M42'],
      ['Canon P', 'M42'], ['Canon Sure Shot / Autoboy', 'Fixed'], ['Canon Sure Shot Telemax', 'Fixed'], ['Canon AF35M', 'Fixed'],
      ['Canon Prima Mini / Sure Shot Classic', 'Fixed'], ['Canon Demi (half-frame)', 'Fixed']
    ]
  },
  {
    brand: 'Nikon',
    make: 'NIKON CORPORATION',
    filmMake: 'Nikon',
    digital: [
      ['NIKON Z 9', 'Z', 'Nikon Z9'], ['NIKON Z 8', 'Z', 'Nikon Z8'], ['NIKON Z6_3', 'Z', 'Nikon Z6III'],
      ['NIKON Z 6_2', 'Z', 'Nikon Z6II'], ['NIKON Z 6', 'Z', 'Nikon Z6'], ['NIKON Z 7_2', 'Z', 'Nikon Z7II'],
      ['NIKON Z 7', 'Z', 'Nikon Z7'], ['NIKON Z5_2', 'Z', 'Nikon Z5II'], ['NIKON Z 5', 'Z', 'Nikon Z5'],
      ['NIKON Z f', 'Z', 'Nikon Zf'], ['NIKON Z fc', 'Z-DX', 'Nikon Zfc'], ['NIKON Z50_2', 'Z-DX', 'Nikon Z50II'],
      ['NIKON Z 50', 'Z-DX', 'Nikon Z50'], ['NIKON Z 30', 'Z-DX', 'Nikon Z30'],
      ['NIKON D6', 'F', 'Nikon D6'], ['NIKON D5', 'F', 'Nikon D5'], ['NIKON D4S', 'F', 'Nikon D4S'],
      ['NIKON D850', 'F', 'Nikon D850'], ['NIKON D810', 'F', 'Nikon D810'], ['NIKON D800', 'F', 'Nikon D800'],
      ['NIKON D800E', 'F', 'Nikon D800E'], ['NIKON D780', 'F', 'Nikon D780'], ['NIKON D750', 'F', 'Nikon D750'],
      ['NIKON D700', 'F', 'Nikon D700'], ['NIKON D610', 'F', 'Nikon D610'], ['NIKON D600', 'F', 'Nikon D600'],
      ['NIKON Df', 'F', 'Nikon Df'], ['NIKON D3S', 'F', 'Nikon D3S'], ['NIKON D500', 'F-DX', 'Nikon D500'],
      ['NIKON D7500', 'F-DX', 'Nikon D7500'], ['NIKON D7200', 'F-DX', 'Nikon D7200'], ['NIKON D7100', 'F-DX', 'Nikon D7100'],
      ['NIKON D7000', 'F-DX', 'Nikon D7000'], ['NIKON D90', 'F-DX', 'Nikon D90'], ['NIKON D5600', 'F-DX', 'Nikon D5600'],
      ['NIKON D5300', 'F-DX', 'Nikon D5300'], ['NIKON D3500', 'F-DX', 'Nikon D3500'], ['NIKON D3400', 'F-DX', 'Nikon D3400'],
      ['NIKON D3300', 'F-DX', 'Nikon D3300'], ['NIKON D300S', 'F-DX', 'Nikon D300S'], ['NIKON D200', 'F-DX', 'Nikon D200'],
      ['COOLPIX P1100', 'Fixed', 'Nikon Coolpix P1100'], ['COOLPIX P1000', 'Fixed', 'Nikon Coolpix P1000'],
      ['COOLPIX A', 'Fixed-APSC', 'Nikon Coolpix A']
    ],
    film: [
      ['Nikon F', 'F'], ['Nikon F2', 'F'], ['Nikon F3', 'F'], ['Nikon F3HP', 'F'], ['Nikon F4', 'F'], ['Nikon F5', 'F'],
      ['Nikon F6', 'F'], ['Nikon F100', 'F'], ['Nikon F80 / N80', 'F'], ['Nikon F90X / N90s', 'F'], ['Nikon FM', 'F'],
      ['Nikon FM2', 'F'], ['Nikon FM2n', 'F'], ['Nikon FM3A', 'F'], ['Nikon FE', 'F'], ['Nikon FE2', 'F'], ['Nikon FA', 'F'],
      ['Nikon FG', 'F'], ['Nikon EM', 'F'], ['Nikon Nikkormat FT2', 'F'], ['Nikon FM10', 'F'], ['Nikon F65 / N65', 'F'],
      ['Nikon 28Ti', 'Fixed'], ['Nikon 35Ti', 'Fixed'], ['Nikon L35AF', 'Fixed'], ['Nikon AF600 / Lite Touch', 'Fixed']
    ]
  },
  {
    brand: 'Sony',
    make: 'SONY',
    digital: [
      ['ILCE-1M2', 'E', 'Sony α1 II'], ['ILCE-1', 'E', 'Sony α1'], ['ILCE-9M3', 'E', 'Sony α9 III'], ['ILCE-9M2', 'E', 'Sony α9 II'],
      ['ILCE-9', 'E', 'Sony α9'], ['ILCE-7RM5', 'E', 'Sony α7R V'], ['ILCE-7RM4A', 'E', 'Sony α7R IVA'],
      ['ILCE-7RM4', 'E', 'Sony α7R IV'], ['ILCE-7RM3', 'E', 'Sony α7R III'], ['ILCE-7RM2', 'E', 'Sony α7R II'],
      ['ILCE-7R', 'E', 'Sony α7R'], ['ILCE-7M5', 'E', 'Sony α7 V'], ['ILCE-7M4', 'E', 'Sony α7 IV'], ['ILCE-7M3', 'E', 'Sony α7 III'],
      ['ILCE-7M2', 'E', 'Sony α7 II'], ['ILCE-7', 'E', 'Sony α7'], ['ILCE-7SM3', 'E', 'Sony α7S III'],
      ['ILCE-7SM2', 'E', 'Sony α7S II'], ['ILCE-7CR', 'E', 'Sony α7CR'], ['ILCE-7CM2', 'E', 'Sony α7C II'],
      ['ILCE-7C', 'E', 'Sony α7C'], ['ILCE-6700', 'E-APSC', 'Sony α6700'], ['ILCE-6600', 'E-APSC', 'Sony α6600'],
      ['ILCE-6500', 'E-APSC', 'Sony α6500'], ['ILCE-6400', 'E-APSC', 'Sony α6400'], ['ILCE-6300', 'E-APSC', 'Sony α6300'],
      ['ILCE-6100', 'E-APSC', 'Sony α6100'], ['ILCE-6000', 'E-APSC', 'Sony α6000'], ['ILCE-5100', 'E-APSC', 'Sony α5100'],
      ['ZV-E1', 'E', 'Sony ZV-E1'], ['ZV-E10M2', 'E-APSC', 'Sony ZV-E10 II'], ['ZV-E10', 'E-APSC', 'Sony ZV-E10'],
      ['ILME-FX3', 'E', 'Sony FX3'], ['ILME-FX30', 'E-APSC', 'Sony FX30'], ['ILCA-99M2', 'A', 'Sony α99 II'],
      ['ILCA-77M2', 'A', 'Sony α77 II'], ['DSC-RX1RM3', 'Fixed-FF', 'Sony RX1R III'], ['DSC-RX1RM2', 'Fixed-FF', 'Sony RX1R II'],
      ['DSC-RX100M7', 'Fixed-1in', 'Sony RX100 VII'], ['DSC-RX100M6', 'Fixed-1in', 'Sony RX100 VI'],
      ['DSC-RX100M5A', 'Fixed-1in', 'Sony RX100 VA'], ['DSC-RX100M3', 'Fixed-1in', 'Sony RX100 III'],
      ['DSC-RX10M4', 'Fixed-1in', 'Sony RX10 IV'], ['ZV-1M2', 'Fixed-1in', 'Sony ZV-1 II'], ['ZV-1', 'Fixed-1in', 'Sony ZV-1']
    ]
  },
  {
    brand: 'Fujifilm',
    make: 'FUJIFILM',
    digital: [
      ['X-H2S', 'X'], ['X-H2', 'X'], ['X-H1', 'X'], ['X-T5', 'X'], ['X-T4', 'X'], ['X-T3', 'X'], ['X-T2', 'X'], ['X-T1', 'X'],
      ['X-T50', 'X'], ['X-T30 II', 'X'], ['X-T30', 'X'], ['X-T20', 'X'], ['X-S20', 'X'], ['X-S10', 'X'], ['X-Pro3', 'X'],
      ['X-Pro2', 'X'], ['X-E5', 'X'], ['X-E4', 'X'], ['X-E3', 'X'], ['X-M5', 'X'], ['X-A7', 'X'], ['X100VI', 'Fixed-APSC'],
      ['X100V', 'Fixed-APSC'], ['X100F', 'Fixed-APSC'], ['X100T', 'Fixed-APSC'], ['X100S', 'Fixed-APSC'],
      ['XF10', 'Fixed-APSC'], ['X-half', 'Fixed'], ['GFX100 II', 'GF'], ['GFX100S II', 'GF'], ['GFX100S', 'GF'],
      ['GFX100', 'GF'], ['GFX100RF', 'Fixed', 'GFX100RF'], ['GFX 50S II', 'GF'], ['GFX 50R', 'GF'], ['GFX 50S', 'GF']
    ],
    film: [
      ['FUJIFILM GW690III', 'P69', 'Fujica GW690III'], ['FUJIFILM GSW690III', 'P69', 'Fujica GSW690III'],
      ['FUJIFILM GA645', 'P645'], ['FUJIFILM GA645Zi', 'P645'], ['FUJIFILM GF670', 'P67'], ['FUJIFILM GS645S', 'P645'],
      ['FUJIFILM TX-1', 'Fixed'], ['FUJIFILM Klasse W', 'Fixed'], ['FUJIFILM Klasse S', 'Fixed'],
      ['FUJIFILM Natura Classica', 'Fixed'], ['FUJIFILM Natura Black', 'Fixed'], ['Fujica ST801', 'M42']
    ]
  },
  {
    brand: 'Panasonic',
    make: 'Panasonic',
    digital: [
      ['DC-S1RM2', 'L', 'Lumix S1R II'], ['DC-S1M2', 'L', 'Lumix S1 II'], ['DC-S1M2E', 'L', 'Lumix S1 IIE'],
      ['DC-S5M2X', 'L', 'Lumix S5 IIX'], ['DC-S5M2', 'L', 'Lumix S5 II'], ['DC-S5', 'L', 'Lumix S5'], ['DC-S9', 'L', 'Lumix S9'],
      ['DC-S1R', 'L', 'Lumix S1R'], ['DC-S1H', 'L', 'Lumix S1H'], ['DC-S1', 'L', 'Lumix S1'], ['DC-GH7', 'MFT', 'Lumix GH7'],
      ['DC-GH6', 'MFT', 'Lumix GH6'], ['DC-GH5M2', 'MFT', 'Lumix GH5 II'], ['DC-GH5S', 'MFT', 'Lumix GH5S'],
      ['DC-GH5', 'MFT', 'Lumix GH5'], ['DC-G9M2', 'MFT', 'Lumix G9 II'], ['DC-G9', 'MFT', 'Lumix G9'],
      ['DC-G100D', 'MFT', 'Lumix G100D'], ['DC-G100', 'MFT', 'Lumix G100'], ['DC-G95', 'MFT', 'Lumix G95 / G90'],
      ['DC-G85', 'MFT', 'Lumix G85 / G80'], ['DC-GX9', 'MFT', 'Lumix GX9'], ['DMC-GX85', 'MFT', 'Lumix GX85 / GX80'],
      ['DMC-GX8', 'MFT', 'Lumix GX8'], ['DC-LX100M2', 'Fixed', 'Lumix LX100 II'], ['DC-ZS200', 'Fixed-1in', 'Lumix ZS200 / TZ200'],
      ['DC-FZ1000M2', 'Fixed-1in', 'Lumix FZ1000 II']
    ]
  },
  {
    brand: 'OM System / Olympus',
    make: 'OM Digital Solutions',
    filmMake: 'Olympus',
    digital: [
      ['OM-1MarkII', 'MFT', 'OM System OM-1 Mark II'], ['OM-1', 'MFT', 'OM System OM-1'], ['OM-3', 'MFT', 'OM System OM-3'],
      ['OM-5MarkII', 'MFT', 'OM System OM-5 Mark II'], ['OM-5', 'MFT', 'OM System OM-5'],
      ['OM-D E-M1X', 'MFT', 'Olympus OM-D E-M1X'], ['E-M1MarkIII', 'MFT', 'Olympus OM-D E-M1 Mark III'],
      ['E-M1MarkII', 'MFT', 'Olympus OM-D E-M1 Mark II'], ['E-M1', 'MFT', 'Olympus OM-D E-M1'],
      ['E-M5MarkIII', 'MFT', 'Olympus OM-D E-M5 Mark III'], ['E-M5MarkII', 'MFT', 'Olympus OM-D E-M5 Mark II'],
      ['E-M10MarkIV', 'MFT', 'Olympus OM-D E-M10 Mark IV'], ['E-M10MarkIII', 'MFT', 'Olympus OM-D E-M10 Mark III'],
      ['E-P7', 'MFT', 'Olympus PEN E-P7'], ['PEN-F', 'MFT', 'Olympus PEN-F'], ['TG-7', 'Fixed', 'OM System Tough TG-7'],
      ['TG-6', 'Fixed', 'Olympus Tough TG-6']
    ],
    film: [
      ['Olympus OM-1', 'OM'], ['Olympus OM-1n', 'OM'], ['Olympus OM-2', 'OM'], ['Olympus OM-2n', 'OM'], ['Olympus OM-2 SP', 'OM'],
      ['Olympus OM-3', 'OM'], ['Olympus OM-4', 'OM'], ['Olympus OM-4Ti', 'OM'], ['Olympus OM-10', 'OM'], ['Olympus OM-G', 'OM'],
      ['Olympus XA', 'Fixed'], ['Olympus XA2', 'Fixed'], ['Olympus μ[mju:]-II / Stylus Epic', 'Fixed'], ['Olympus μ[mju:]', 'Fixed'],
      ['Olympus 35 RC', 'Fixed'], ['Olympus 35 SP', 'Fixed'], ['Olympus Trip 35', 'Fixed'], ['Olympus Pen F (half-frame)', 'Fixed'],
      ['Olympus Pen EE-3', 'Fixed'], ['Olympus Stylus Zoom', 'Fixed']
    ]
  },
  {
    brand: 'Pentax / Ricoh',
    make: 'RICOH IMAGING COMPANY, LTD.',
    filmMake: 'PENTAX',
    digital: [
      ['PENTAX K-1 Mark II', 'K'], ['PENTAX K-1', 'K'], ['PENTAX K-3 Mark III Monochrome', 'K-APSC'],
      ['PENTAX K-3 Mark III', 'K-APSC'], ['PENTAX K-3 II', 'K-APSC'], ['PENTAX KF', 'K-APSC'], ['PENTAX K-70', 'K-APSC'],
      ['PENTAX KP', 'K-APSC'], ['PENTAX K-S2', 'K-APSC'], ['PENTAX 645Z', 'P645'], ['RICOH GR IV', 'Fixed-APSC', 'Ricoh GR IV'],
      ['RICOH GR IIIx', 'Fixed-APSC', 'Ricoh GR IIIx'], ['RICOH GR III', 'Fixed-APSC', 'Ricoh GR III'],
      ['GR II', 'Fixed-APSC', 'Ricoh GR II'], ['RICOH WG-80', 'Fixed']
    ],
    film: [
      ['PENTAX K1000', 'K'], ['PENTAX MX', 'K'], ['PENTAX ME', 'K'], ['PENTAX ME Super', 'K'], ['PENTAX LX', 'K'],
      ['PENTAX KX', 'K'], ['PENTAX KM', 'K'], ['PENTAX Program A / Super Program', 'K'], ['PENTAX P30', 'K'], ['PENTAX MZ-S', 'K'],
      ['PENTAX MZ-5n / ZX-5n', 'K'], ['Asahi Pentax Spotmatic', 'M42'], ['Asahi Pentax Spotmatic F', 'M42'],
      ['Asahi Pentax S1a', 'M42'], ['PENTAX 67', 'P67'], ['PENTAX 67II', 'P67'], ['PENTAX 6x7', 'P67'], ['PENTAX 645', 'P645'],
      ['PENTAX 645N', 'P645'], ['PENTAX 645NII', 'P645'], ['PENTAX 17', 'Fixed'], ['PENTAX Espio Mini', 'Fixed'],
      ['PENTAX PC35AF', 'Fixed'], ['RICOH GR1', 'Fixed'], ['RICOH GR1s', 'Fixed'], ['RICOH GR1v', 'Fixed'], ['RICOH GR21', 'Fixed'],
      ['RICOH R1', 'Fixed'], ['RICOH 500G', 'Fixed']
    ]
  },
  {
    brand: 'Leica',
    make: 'LEICA CAMERA AG',
    filmMake: 'Leica',
    digital: [
      ['LEICA M11-P', 'M', 'Leica M11-P'], ['LEICA M11', 'M', 'Leica M11'], ['LEICA M11 Monochrom', 'M', 'Leica M11 Monochrom'],
      ['LEICA M11-D', 'M', 'Leica M11-D'], ['LEICA M EV1', 'M', 'Leica M EV1'], ['LEICA M10-R', 'M', 'Leica M10-R'],
      ['LEICA M10-P', 'M', 'Leica M10-P'], ['LEICA M10', 'M', 'Leica M10'], ['LEICA M10 MONOCHROM', 'M', 'Leica M10 Monochrom'],
      ['LEICA M (Typ 240)', 'M', 'Leica M (Typ 240)'], ['LEICA Q3', 'Fixed-FF', 'Leica Q3'], ['LEICA Q3 43', 'Fixed-FF', 'Leica Q3 43'],
      ['LEICA Q2', 'Fixed-FF', 'Leica Q2'], ['LEICA Q2 MONOCHROM', 'Fixed-FF', 'Leica Q2 Monochrom'],
      ['LEICA Q (Typ 116)', 'Fixed-FF', 'Leica Q (Typ 116)'], ['LEICA SL3', 'L', 'Leica SL3'], ['LEICA SL3-S', 'L', 'Leica SL3-S'],
      ['LEICA SL2-S', 'L', 'Leica SL2-S'], ['LEICA SL2', 'L', 'Leica SL2'], ['LEICA CL', 'L-APSC', 'Leica CL'],
      ['LEICA D-LUX 8', 'Fixed', 'Leica D-Lux 8'], ['LEICA D-LUX 7', 'Fixed', 'Leica D-Lux 7']
    ],
    film: [
      ['Leica M2', 'M'], ['Leica M3', 'M'], ['Leica M4', 'M'], ['Leica M4-2', 'M'], ['Leica M4-P', 'M'], ['Leica M5', 'M'],
      ['Leica M6', 'M'], ['Leica M6 TTL', 'M'], ['Leica M6 (2022)', 'M'], ['Leica M7', 'M'], ['Leica MP', 'M'], ['Leica M-A', 'M'],
      ['Leica CL (film)', 'M'], ['Leica R4', 'R'], ['Leica R6.2', 'R'], ['Leica R7', 'R'], ['Leica R8', 'R'], ['Leica IIIf', 'M42'],
      ['Leica Minilux', 'Fixed'], ['Leica CM', 'Fixed']
    ]
  },
  {
    brand: 'Hasselblad',
    make: 'Hasselblad',
    digital: [
      ['X2D II 100C', 'XCD', 'Hasselblad X2D II 100C'], ['X2D 100C', 'XCD', 'Hasselblad X2D 100C'],
      ['X1D II 50C', 'XCD', 'Hasselblad X1D II 50C'], ['X1D-50c', 'XCD', 'Hasselblad X1D-50c'],
      ['907X 100C', 'XCD', 'Hasselblad 907X & CFV 100C'], ['907X', 'XCD', 'Hasselblad 907X 50C']
    ],
    film: [
      ['Hasselblad 500C', 'P66'], ['Hasselblad 500C/M', 'P66'], ['Hasselblad 501CM', 'P66'], ['Hasselblad 503CW', 'P66'],
      ['Hasselblad 503CX', 'P66'], ['Hasselblad 2000FC/M', 'P66'], ['Hasselblad SWC/M', 'P66'], ['Hasselblad XPan', 'Fixed'],
      ['Hasselblad XPan II', 'Fixed'], ['Hasselblad H1', 'P645']
    ]
  },
  {
    brand: 'Sigma',
    make: 'SIGMA',
    digital: [
      ['SIGMA BF', 'L', 'Sigma BF'], ['SIGMA fp L', 'L', 'Sigma fp L'], ['SIGMA fp', 'L', 'Sigma fp'],
      ['SIGMA sd Quattro H', 'Fixed', 'Sigma sd Quattro H'], ['SIGMA dp2 Quattro', 'Fixed-APSC', 'Sigma dp2 Quattro']
    ]
  },
  {
    brand: 'Apple',
    make: 'Apple',
    digital: [
      ['iPhone 17 Pro Max', 'Phone'], ['iPhone 17 Pro', 'Phone'], ['iPhone Air', 'Phone'], ['iPhone 17', 'Phone'],
      ['iPhone 16 Pro Max', 'Phone'], ['iPhone 16 Pro', 'Phone'], ['iPhone 16 Plus', 'Phone'], ['iPhone 16', 'Phone'],
      ['iPhone 16e', 'Phone'], ['iPhone 15 Pro Max', 'Phone'], ['iPhone 15 Pro', 'Phone'], ['iPhone 15 Plus', 'Phone'],
      ['iPhone 15', 'Phone'], ['iPhone 14 Pro Max', 'Phone'], ['iPhone 14 Pro', 'Phone'], ['iPhone 14 Plus', 'Phone'],
      ['iPhone 14', 'Phone'], ['iPhone 13 Pro Max', 'Phone'], ['iPhone 13 Pro', 'Phone'], ['iPhone 13 mini', 'Phone'],
      ['iPhone 13', 'Phone'], ['iPhone 12 Pro Max', 'Phone'], ['iPhone 12 Pro', 'Phone'], ['iPhone 12 mini', 'Phone'],
      ['iPhone 12', 'Phone'], ['iPhone 11 Pro Max', 'Phone'], ['iPhone 11 Pro', 'Phone'], ['iPhone 11', 'Phone'],
      ['iPhone SE (3rd generation)', 'Phone'], ['iPhone XS', 'Phone'], ['iPhone XR', 'Phone'], ['iPhone X', 'Phone'],
      ['iPad Pro (11-inch) (4th generation)', 'Phone']
    ]
  },
  {
    brand: 'Google',
    make: 'Google',
    digital: [
      ['Pixel 10 Pro XL', 'Phone'], ['Pixel 10 Pro', 'Phone'], ['Pixel 10', 'Phone'], ['Pixel 9 Pro XL', 'Phone'],
      ['Pixel 9 Pro', 'Phone'], ['Pixel 9', 'Phone'], ['Pixel 9a', 'Phone'], ['Pixel 8 Pro', 'Phone'], ['Pixel 8', 'Phone'],
      ['Pixel 8a', 'Phone'], ['Pixel 7 Pro', 'Phone'], ['Pixel 7', 'Phone'], ['Pixel 7a', 'Phone'], ['Pixel 6 Pro', 'Phone'],
      ['Pixel 6', 'Phone']
    ]
  },
  {
    brand: 'Samsung',
    make: 'samsung',
    digital: [
      ['SM-S938B', 'Phone', 'Galaxy S25 Ultra'], ['SM-S936B', 'Phone', 'Galaxy S25+'], ['SM-S931B', 'Phone', 'Galaxy S25'],
      ['SM-S928B', 'Phone', 'Galaxy S24 Ultra'], ['SM-S926B', 'Phone', 'Galaxy S24+'], ['SM-S921B', 'Phone', 'Galaxy S24'],
      ['SM-S918B', 'Phone', 'Galaxy S23 Ultra'], ['SM-S911B', 'Phone', 'Galaxy S23'], ['SM-S908B', 'Phone', 'Galaxy S22 Ultra'],
      ['SM-F956B', 'Phone', 'Galaxy Z Fold6'], ['SM-A566B', 'Phone', 'Galaxy A56']
    ]
  },
  {
    brand: 'DJI',
    make: 'DJI',
    digital: [
      ['FC8482', 'Drone', 'DJI Mini 4 Pro'], ['FC3582', 'Drone', 'DJI Mini 3 Pro'], ['FC3682', 'Drone', 'DJI Mini 3'],
      ['L2D-20c', 'Drone', 'DJI Mavic 3 / 3 Classic'], ['FC4170', 'Drone', 'DJI Mavic 3 Pro'], ['FC3411', 'Drone', 'DJI Air 2S'],
      ['FC8282', 'Drone', 'DJI Air 3'], ['Osmo Pocket 3', 'Drone', 'DJI Osmo Pocket 3'], ['Osmo Action 5 Pro', 'Drone', 'DJI Osmo Action 5 Pro']
    ]
  },
  {
    brand: 'GoPro',
    make: 'GoPro',
    digital: [
      ['HERO13 Black', 'Drone'], ['HERO12 Black', 'Drone'], ['HERO11 Black', 'Drone'], ['HERO10 Black', 'Drone'],
      ['HERO9 Black', 'Drone'], ['MAX', 'Drone']
    ]
  },
  {
    brand: 'Minolta',
    make: 'Minolta',
    digital: [],
    film: [
      ['Minolta X-700', 'MD'], ['Minolta X-570 / X-500', 'MD'], ['Minolta X-370', 'MD'], ['Minolta XD-7 / XD-11', 'MD'],
      ['Minolta XE-7', 'MD'], ['Minolta SRT-101', 'MD'], ['Minolta SRT-102', 'MD'], ['Minolta XG-M', 'MD'],
      ['Minolta Maxxum 7 / Dynax 7', 'A'], ['Minolta Maxxum 9 / Dynax 9', 'A'], ['Minolta Maxxum 7000', 'A'],
      ['Minolta CLE', 'M'], ['Minolta Hi-Matic 7s', 'Fixed'], ['Minolta Hi-Matic AF2', 'Fixed'], ['Minolta TC-1', 'Fixed'],
      ['Minolta Autocord', 'P66']
    ]
  },
  {
    brand: 'Contax / Yashica / Kyocera',
    make: 'Contax',
    digital: [],
    film: [
      ['Contax G1', 'G'], ['Contax G2', 'G'], ['Contax T2', 'Fixed'], ['Contax T3', 'Fixed'], ['Contax T', 'Fixed'],
      ['Contax TVS', 'Fixed'], ['Contax RTS II', 'CY'], ['Contax RTS III', 'CY'], ['Contax 139 Quartz', 'CY'],
      ['Contax 167MT', 'CY'], ['Contax Aria', 'CY'], ['Contax RX', 'CY'], ['Contax 645', 'P645'],
      ['Yashica Mat-124G', 'P66'], ['Yashica Electro 35 GSN', 'Fixed'], ['Yashica T4 / T5', 'Fixed'], ['Yashica T3', 'Fixed'],
      ['Yashica FX-3 Super 2000', 'CY'], ['Yashica FR-I', 'CY'], ['Yashica Lynx 14', 'Fixed'], ['Kyocera Slim T', 'Fixed']
    ]
  },
  {
    brand: 'Mamiya',
    make: 'Mamiya',
    digital: [],
    film: [
      ['Mamiya RB67 Pro S', 'P67'], ['Mamiya RB67 Pro SD', 'P67'], ['Mamiya RZ67 Pro II', 'P67'], ['Mamiya RZ67 Pro IID', 'P67'],
      ['Mamiya 7', 'P67'], ['Mamiya 7II', 'P67'], ['Mamiya 6', 'P66'], ['Mamiya 645 Pro', 'P645'], ['Mamiya 645 Pro TL', 'P645'],
      ['Mamiya 645AF', 'P645'], ['Mamiya 645 1000S', 'P645'], ['Mamiya C330', 'P66'], ['Mamiya C220', 'P66'],
      ['Mamiya Press Universal', 'P69']
    ]
  },
  {
    brand: 'Bronica',
    make: 'Bronica',
    digital: [],
    film: [
      ['Bronica SQ-A', 'P66'], ['Bronica SQ-Ai', 'P66'], ['Bronica SQ-B', 'P66'], ['Bronica ETRS', 'P645'],
      ['Bronica ETRSi', 'P645'], ['Bronica GS-1', 'P67'], ['Bronica RF645', 'P645']
    ]
  },
  {
    brand: 'Rollei',
    make: 'Rollei',
    digital: [],
    film: [
      ['Rolleiflex 2.8F', 'P66'], ['Rolleiflex 3.5F', 'P66'], ['Rolleiflex 2.8GX', 'P66'], ['Rolleiflex T', 'P66'],
      ['Rolleicord V', 'P66'], ['Rollei 35', 'Fixed'], ['Rollei 35 S', 'Fixed'], ['Rollei 35 SE', 'Fixed'],
      ['Rolleiflex SL66', 'P66'], ['Rollei Prego 90', 'Fixed']
    ]
  },
  {
    brand: 'Voigtländer / Zeiss / Konica',
    make: 'Voigtländer',
    digital: [],
    film: [
      ['Voigtländer Bessa R', 'M42'], ['Voigtländer Bessa R2A', 'M'], ['Voigtländer Bessa R3A', 'M'], ['Voigtländer Bessa R4A', 'M'],
      ['Voigtländer Bessa-L', 'M42'], ['Voigtländer Vito B', 'Fixed'], ['Zeiss Ikon ZM', 'M'], ['Zeiss Ikon Contessa', 'Fixed'],
      ['Konica Hexar AF', 'Fixed'], ['Konica Hexar RF', 'M'], ['Konica C35', 'Fixed'], ['Konica Big Mini', 'Fixed'],
      ['Konica Autoreflex T3', 'Fixed']
    ]
  },
  {
    brand: 'Kodak / Lomography / Others',
    make: 'Kodak',
    digital: [],
    film: [
      ['Kodak Retina IIIc', 'Fixed'], ['Kodak Retina Ia', 'Fixed'], ['Kodak Ektar H35', 'Fixed'], ['Kodak Ektar H35N', 'Fixed'],
      ['Kodak Brownie Hawkeye', 'P66'], ['Kodak Ultra F9', 'Fixed'], ['Kodak FunSaver (single-use)', 'Fixed'],
      ['Lomography LC-A+', 'Fixed'], ['Lomography LC-Wide', 'Fixed'], ['Lomo LC-A', 'Fixed'], ['Lomography Diana F+', 'P66'],
      ['Lomography Lomo\'Instant', 'Fixed'], ['Holga 120N', 'P66'], ['Holga 135', 'Fixed'], ['Polaroid SX-70', 'Fixed'],
      ['Polaroid 600 OneStep', 'Fixed'], ['Polaroid Now+', 'Fixed'], ['Instax Mini 99', 'Fixed'], ['Instax Wide 400', 'Fixed'],
      ['Zenit ET', 'M42'], ['Zenit E', 'M42'], ['Praktica MTL 5B', 'M42'], ['Kiev 88', 'P66'], ['Kiev 60', 'P66'],
      ['Graflex Crown Graphic 4x5', 'Fixed'], ['Chamonix 45N-2', 'Fixed'], ['Intrepid 4x5 Mk5', 'Fixed']
    ]
  }
]

/** Film bodies keep a short manufacturer name as EXIF Make. */
const FILM_MAKE_OVERRIDES: Record<string, string> = {
  'Voigtländer / Zeiss / Konica': '',
  'Kodak / Lomography / Others': '',
  'Contax / Yashica / Kyocera': ''
}

function filmMakeFor(brand: BrandDef, model: string): string {
  if (brand.brand in FILM_MAKE_OVERRIDES) return model.split(' ')[0].replace(/'.*$/, '')
  if (brand.brand === 'Fujifilm') return 'FUJIFILM'
  return brand.filmMake ?? brand.make
}

const ALL_CAMERAS: CameraModel[] = BRANDS.flatMap((b) => [
  ...b.digital.map(([model, mount, label]) => ({ make: b.make, model, label, mount, brand: b.brand })),
  ...(b.film ?? []).map(([model, mount, label]) => ({
    make: filmMakeFor(b, model),
    model,
    label,
    mount,
    film: true,
    brand: b.brand
  }))
])

export const CAMERAS: CameraModel[] = ALL_CAMERAS.filter(
  (c, i, arr) => arr.findIndex((o) => o.make === c.make && o.model === c.model) === i
)

export const CAMERA_MAKES: string[] = Array.from(new Set(CAMERAS.map((c) => c.make))).sort((a, b) =>
  a.localeCompare(b)
)

/** Make strings that should be treated as the same manufacturer. */
export const MAKE_ALIASES: Record<string, string[]> = {
  Canon: ['Canon', 'CANON'],
  'NIKON CORPORATION': ['NIKON CORPORATION', 'NIKON', 'Nikon'],
  SONY: ['SONY', 'Sony'],
  FUJIFILM: ['FUJIFILM', 'Fujifilm', 'FUJI PHOTO FILM CO., LTD.'],
  Panasonic: ['Panasonic', 'PANASONIC'],
  'OM Digital Solutions': ['OM Digital Solutions', 'OLYMPUS CORPORATION', 'OLYMPUS IMAGING CORP.', 'Olympus', 'OLYMPUS'],
  'RICOH IMAGING COMPANY, LTD.': ['RICOH IMAGING COMPANY, LTD.', 'PENTAX', 'PENTAX Corporation', 'RICOH', 'Ricoh', 'Pentax'],
  'LEICA CAMERA AG': ['LEICA CAMERA AG', 'Leica Camera AG', 'LEICA', 'Leica'],
  samsung: ['samsung', 'SAMSUNG', 'Samsung']
}

export function sameMake(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false
  if (a.toLowerCase() === b.toLowerCase()) return true
  for (const list of Object.values(MAKE_ALIASES)) {
    const lower = list.map((x) => x.toLowerCase())
    if (lower.includes(a.toLowerCase()) && lower.includes(b.toLowerCase())) return true
  }
  return false
}

export function findCamera(make: string | null | undefined, model: string | null | undefined): CameraModel | undefined {
  if (!model) return undefined
  const m = model.toLowerCase()
  return (
    CAMERAS.find((c) => c.model.toLowerCase() === m && (!make || sameMake(c.make, make))) ??
    CAMERAS.find((c) => c.model.toLowerCase() === m || c.label?.toLowerCase() === m)
  )
}
