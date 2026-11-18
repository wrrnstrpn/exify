/**
 * Lens database, grouped by manufacturer (EXIF LensMake) and mount. Model
 * strings follow the way each maker's bodies write EXIF LensModel.
 */

export interface LensModel {
  make: string
  model: string
  mount: string
}

type Group = [make: string, mount: string, models: string[]]

const GROUPS: Group[] = [
  // ------------------------------------------------------------------ Canon
  ['Canon', 'RF', [
    // Ultra-wide & wide zooms
    'RF10-20mm F4 L IS STM', 'RF14-35mm F4 L IS USM', 'RF15-35mm F2.8 L IS USM', 'RF15-30mm F4.5-6.3 IS STM',
    'RF16-28mm F2.8 IS STM',
    // Standard zooms
    'RF24-50mm F4.5-6.3 IS STM', 'RF24-70mm F2.8 L IS USM', 'RF24-70mm F2.8 L IS USM Z', 'RF24-105mm F4 L IS USM',
    'RF24-105mm F4-7.1 IS STM', 'RF24-105mm F2.8 L IS USM Z', 'RF24-240mm F4-6.3 IS USM', 'RF28-70mm F2 L USM',
    'RF28-70mm F2.8 IS STM',
    // Telephoto zooms
    'RF70-200mm F2.8 L IS USM', 'RF70-200mm F2.8 L IS USM Z', 'RF70-200mm F4 L IS USM', 'RF75-300mm F4-5.6',
    'RF100-300mm F2.8 L IS USM', 'RF100-400mm F5.6-8 IS USM', 'RF100-500mm F4.5-7.1 L IS USM', 'RF200-800mm F6.3-9 IS USM',
    // Primes
    'RF14mm F1.4 L VCM', 'RF16mm F2.8 STM', 'RF20mm F1.4 L VCM', 'RF24mm F1.4 L VCM', 'RF24mm F1.8 MACRO IS STM',
    'RF28mm F2.8 STM', 'RF35mm F1.4 L VCM', 'RF35mm F1.8 MACRO IS STM', 'RF45mm F1.2 STM', 'RF50mm F1.2 L USM',
    'RF50mm F1.4 L VCM', 'RF50mm F1.8 STM', 'RF85mm F1.2 L USM', 'RF85mm F1.2 L USM DS', 'RF85mm F1.4 L VCM',
    'RF85mm F2 MACRO IS STM', 'RF100mm F2.8 L MACRO IS USM', 'RF135mm F1.8 L IS USM',
    // Super-telephoto
    'RF400mm F2.8 L IS USM', 'RF600mm F4 L IS USM', 'RF800mm F5.6 L IS USM', 'RF1200mm F8 L IS USM',
    'RF600mm F11 IS STM', 'RF800mm F11 IS STM',
    // Specialty
    'RF5.2mm F2.8 L DUAL FISHEYE',
    // With extenders (Canon writes the combined name)
    'RF100-500mm F4.5-7.1 L IS USM +RF1.4x', 'RF100-500mm F4.5-7.1 L IS USM +RF2x', 'RF100-300mm F2.8 L IS USM +RF1.4x',
    'RF600mm F4 L IS USM +RF1.4x', 'RF400mm F2.8 L IS USM +RF2x'
  ]],
  ['Canon', 'RF-S', [
    'RF-S10-18mm F4.5-6.3 IS STM', 'RF-S14-30mm F4-6.3 IS STM PZ', 'RF-S18-45mm F4.5-6.3 IS STM', 'RF-S18-150mm F3.5-6.3 IS STM',
    'RF-S55-210mm F5-7.1 IS STM', 'RF-S3.9mm F3.5 STM DUAL FISHEYE', 'RF-S7.8mm F4 STM DUAL'
  ]],
  ['Canon', 'EF', [
    // Fisheye & ultra-wide
    'EF8-15mm f/4L FISHEYE USM', 'EF15mm f/2.8 Fisheye', 'EF11-24mm f/4L USM', 'EF14mm f/2.8L II USM', 'EF14mm f/2.8L USM',
    'EF16-35mm f/2.8L III USM', 'EF16-35mm f/2.8L II USM', 'EF16-35mm f/2.8L USM', 'EF16-35mm f/4L IS USM', 'EF17-35mm f/2.8L USM',
    'EF17-40mm f/4L USM', 'EF20-35mm f/3.5-4.5 USM',
    // Wide primes
    'EF20mm f/2.8 USM', 'EF24mm f/1.4L II USM', 'EF24mm f/1.4L USM', 'EF24mm f/2.8 IS USM', 'EF24mm f/2.8',
    'EF28mm f/1.8 USM', 'EF28mm f/2.8 IS USM', 'EF28mm f/2.8', 'EF35mm f/1.4L II USM', 'EF35mm f/1.4L USM',
    'EF35mm f/2 IS USM', 'EF35mm f/2', 'EF40mm f/2.8 STM',
    // Standard zooms
    'EF24-70mm f/2.8L II USM', 'EF24-70mm f/2.8L USM', 'EF24-70mm f/4L IS USM', 'EF24-105mm f/4L IS II USM',
    'EF24-105mm f/4L IS USM', 'EF24-105mm f/3.5-5.6 IS STM', 'EF24-85mm f/3.5-4.5 USM', 'EF28-70mm f/2.8L USM',
    'EF28-80mm f/3.5-5.6 II', 'EF28-90mm f/4-5.6 III', 'EF28-105mm f/3.5-4.5 II USM', 'EF28-135mm f/3.5-5.6 IS USM',
    'EF28-200mm f/3.5-5.6 USM', 'EF28-300mm f/3.5-5.6L IS USM', 'EF35-80mm f/4-5.6', 'EF35-135mm f/4-5.6 USM',
    // Normal primes
    'EF50mm f/1.0L USM', 'EF50mm f/1.2L USM', 'EF50mm f/1.4 USM', 'EF50mm f/1.8 STM', 'EF50mm f/1.8 II', 'EF50mm f/1.8',
    'EF50mm f/2.5 Compact Macro',
    // Portrait & macro primes
    'EF85mm f/1.2L II USM', 'EF85mm f/1.2L USM', 'EF85mm f/1.4L IS USM', 'EF85mm f/1.8 USM', 'EF100mm f/2 USM',
    'EF100mm f/2.8L Macro IS USM', 'EF100mm f/2.8 Macro USM', 'EF100mm f/2.8 Macro', 'EF135mm f/2L USM',
    'EF135mm f/2.8 Softfocus', 'EF180mm f/3.5L Macro USM', 'MP-E65mm f/2.8 1-5x Macro Photo', 'MP-E65mm f/2.8 1-5x Macro',
    // Telephoto zooms
    'EF70-200mm f/2.8L IS III USM', 'EF70-200mm f/2.8L IS II USM', 'EF70-200mm f/2.8L IS USM', 'EF70-200mm f/2.8L USM',
    'EF70-200mm f/4L IS II USM', 'EF70-200mm f/4L IS USM', 'EF70-200mm f/4L USM', 'EF70-300mm f/4-5.6 IS II USM',
    'EF70-300mm f/4-5.6 IS USM', 'EF70-300mm f/4-5.6L IS USM', 'EF70-300mm f/4.5-5.6 DO IS USM', 'EF75-300mm f/4-5.6 III',
    'EF75-300mm f/4-5.6 III USM', 'EF75-300mm f/4-5.6 IS USM', 'EF80-200mm f/2.8L', 'EF90-300mm f/4.5-5.6 USM',
    'EF100-300mm f/4.5-5.6 USM', 'EF100-400mm f/4.5-5.6L IS II USM', 'EF100-400mm f/4.5-5.6L IS USM',
    'EF200-400mm f/4L IS USM Extender 1.4x', 'EF28-300mm f/3.5-5.6L IS USM',
    // Telephoto primes
    'EF135mm f/2L USM', 'EF200mm f/2L IS USM', 'EF200mm f/2.8L II USM', 'EF300mm f/2.8L IS II USM', 'EF300mm f/2.8L IS USM',
    'EF300mm f/4L IS USM', 'EF400mm f/2.8L IS III USM', 'EF400mm f/2.8L IS II USM', 'EF400mm f/4 DO IS II USM',
    'EF400mm f/4 DO IS USM', 'EF400mm f/5.6L USM', 'EF500mm f/4L IS II USM', 'EF500mm f/4L IS USM', 'EF600mm f/4L IS III USM',
    'EF600mm f/4L IS II USM', 'EF600mm f/4L IS USM', 'EF800mm f/5.6L IS USM',
    // Tilt-shift
    'TS-E17mm f/4L', 'TS-E24mm f/3.5L II', 'TS-E24mm f/3.5L', 'TS-E45mm f/2.8', 'TS-E50mm f/2.8L MACRO', 'TS-E90mm f/2.8L MACRO',
    'TS-E90mm f/2.8', 'TS-E135mm f/4L MACRO',
    // With extenders
    'EF70-200mm f/2.8L IS II USM +1.4x III', 'EF70-200mm f/2.8L IS II USM +2x III', 'EF100-400mm f/4.5-5.6L IS II USM +1.4x III',
    'EF300mm f/2.8L IS II USM +1.4x III', 'EF300mm f/2.8L IS II USM +2x III', 'EF500mm f/4L IS II USM +1.4x III'
  ]],
  ['Canon', 'EF-S', [
    'EF-S10-18mm f/4.5-5.6 IS STM', 'EF-S10-22mm f/3.5-4.5 USM', 'EF-S15-85mm f/3.5-5.6 IS USM', 'EF-S17-55mm f/2.8 IS USM',
    'EF-S17-85mm f/4-5.6 IS USM', 'EF-S18-55mm f/3.5-5.6 IS STM', 'EF-S18-55mm f/4-5.6 IS STM', 'EF-S18-55mm f/3.5-5.6 III',
    'EF-S18-55mm f/3.5-5.6 IS II', 'EF-S18-55mm f/3.5-5.6 IS', 'EF-S18-55mm f/3.5-5.6 II', 'EF-S18-55mm f/3.5-5.6',
    'EF-S18-135mm f/3.5-5.6 IS USM', 'EF-S18-135mm f/3.5-5.6 IS STM', 'EF-S18-135mm f/3.5-5.6 IS',
    'EF-S18-200mm f/3.5-5.6 IS', 'EF-S24mm f/2.8 STM', 'EF-S35mm f/2.8 Macro IS STM', 'EF-S55-250mm f/4-5.6 IS STM',
    'EF-S55-250mm f/4-5.6 IS II', 'EF-S55-250mm f/4-5.6 IS', 'EF-S60mm f/2.8 Macro USM'
  ]],
  ['Canon', 'EF-M', [
    'EF-M11-22mm f/4-5.6 IS STM', 'EF-M15-45mm f/3.5-6.3 IS STM', 'EF-M18-55mm f/3.5-5.6 IS STM', 'EF-M18-150mm f/3.5-6.3 IS STM',
    'EF-M22mm f/2 STM', 'EF-M28mm f/3.5 Macro IS STM', 'EF-M32mm f/1.4 STM', 'EF-M55-200mm f/4.5-6.3 IS STM'
  ]],
  ['Canon', 'FD', [
    'FD 14mm f/2.8 L', 'FD 17mm f/4', 'FD 20mm f/2.8', 'FD 24mm f/1.4 L', 'FD 24mm f/2.8', 'FD 28mm f/2', 'FD 28mm f/2.8',
    'FD 35mm f/2', 'FD 35mm f/2.8', 'FD 50mm f/1.2 L', 'FD 50mm f/1.2', 'FD 50mm f/1.4', 'FD 50mm f/1.8', 'FD 50mm f/3.5 Macro',
    'FD 85mm f/1.2 L', 'FD 85mm f/1.8', 'FD 100mm f/2', 'FD 100mm f/2.8', 'FD 135mm f/2', 'FD 135mm f/2.8', 'FD 200mm f/2.8',
    'FD 200mm f/4', 'FD 300mm f/4 L', 'FD 20-35mm f/3.5 L', 'FD 24-35mm f/3.5 L', 'FD 35-70mm f/3.5-4.5', 'FD 35-70mm f/4',
    'FD 35-105mm f/3.5', 'FD 70-210mm f/4', 'FD 80-200mm f/4 L', 'FD 100-300mm f/5.6', 'FL 55mm f/1.2', 'FL 50mm f/1.8',
    'FD 55mm f/1.2 S.S.C. Aspherical'
  ]],
  ['SIGMA', 'RF-S', [
    '10-18mm F2.8 DC DN | Contemporary 023', '16mm F1.4 DC DN | Contemporary 017', '18-50mm F2.8 DC DN | Contemporary 021',
    '23mm F1.4 DC DN | Contemporary 023', '30mm F1.4 DC DN | Contemporary 016', '56mm F1.4 DC DN | Contemporary 018'
  ]],
  ['TAMRON', 'RF-S', ['11-20mm F/2.8 Di III-A RXD', '18-300mm F/3.5-6.3 Di III-A VC VXD']],
  ['Samyang', 'RF', ['AF 14mm F2.8 RF', 'AF 85mm F1.4 RF']],
  ['SIGMA', 'EF-S', ['10-20mm F3.5 EX DC HSM', '17-50mm F2.8 EX DC OS HSM', '17-70mm F2.8-4 DC MACRO OS HSM | C 013', '18-35mm F1.8 DC HSM | Art 013', '30mm F1.4 DC HSM | Art 013', '50-100mm F1.8 DC HSM | Art 016']],
  ['Tokina', 'EF-S', ['AT-X 11-16mm F2.8 PRO DX II', 'AT-X 11-20mm F2.8 PRO DX', 'AT-X 12-24mm F4 PRO DX']],
  ['TAMRON', 'EF-S', ['SP AF 17-50mm F/2.8 XR Di II VC LD', '18-200mm F/3.5-6.3 Di II VC', '16-300mm F/3.5-6.3 Di II VC PZD MACRO', 'SP AF 10-24mm F/3.5-4.5 Di II LD']],

  // ------------------------------------------------------------------ Nikon
  ['Nikon', 'Z', [
    'NIKKOR Z 14-24mm f/2.8 S', 'NIKKOR Z 14-30mm f/4 S', 'NIKKOR Z 17-28mm f/2.8', 'NIKKOR Z 20mm f/1.8 S',
    'NIKKOR Z 24mm f/1.8 S', 'NIKKOR Z 24-50mm f/4-6.3', 'NIKKOR Z 24-70mm f/2.8 S', 'NIKKOR Z 24-70mm f/2.8 S II',
    'NIKKOR Z 24-70mm f/4 S', 'NIKKOR Z 24-120mm f/4 S', 'NIKKOR Z 24-200mm f/4-6.3 VR', 'NIKKOR Z 26mm f/2.8',
    'NIKKOR Z 28mm f/2.8', 'NIKKOR Z 28-75mm f/2.8', 'NIKKOR Z 28-400mm f/4-8 VR', 'NIKKOR Z 35mm f/1.2 S',
    'NIKKOR Z 35mm f/1.4', 'NIKKOR Z 35mm f/1.8 S', 'NIKKOR Z 40mm f/2', 'NIKKOR Z 40mm f/2 (SE)', 'NIKKOR Z 50mm f/1.2 S',
    'NIKKOR Z 50mm f/1.4', 'NIKKOR Z 50mm f/1.8 S', 'NIKKOR Z 58mm f/0.95 S Noct', 'NIKKOR Z 85mm f/1.2 S',
    'NIKKOR Z 85mm f/1.8 S', 'NIKKOR Z MC 50mm f/2.8', 'NIKKOR Z MC 105mm f/2.8 VR S', 'NIKKOR Z 135mm f/1.8 S Plena',
    'NIKKOR Z 70-180mm f/2.8', 'NIKKOR Z 70-200mm f/2.8 VR S', 'NIKKOR Z 100-400mm f/4.5-5.6 VR S',
    'NIKKOR Z 180-600mm f/5.6-6.3 VR', 'NIKKOR Z 400mm f/4.5 VR S', 'NIKKOR Z 600mm f/6.3 VR S', 'NIKKOR Z 800mm f/6.3 VR S'
  ]],
  ['Nikon', 'Z-DX', [
    'NIKKOR Z DX 12-28mm f/3.5-5.6 PZ VR', 'NIKKOR Z DX 16-50mm f/3.5-6.3 VR', 'NIKKOR Z DX 18-140mm f/3.5-6.3 VR',
    'NIKKOR Z DX 24mm f/1.7', 'NIKKOR Z DX 50-250mm f/4.5-6.3 VR', 'NIKKOR Z DX MC 35mm f/1.7'
  ]],
  ['Nikon', 'F', [
    'AF-S NIKKOR 14-24mm f/2.8G ED', 'AF-S NIKKOR 16-35mm f/4G ED VR', 'AF-S NIKKOR 20mm f/1.8G ED', 'AF-S NIKKOR 24mm f/1.4G ED',
    'AF-S NIKKOR 24-70mm f/2.8E ED VR', 'AF-S NIKKOR 24-70mm f/2.8G ED', 'AF-S NIKKOR 24-120mm f/4G ED VR',
    'AF-S NIKKOR 28mm f/1.8G', 'AF-S NIKKOR 35mm f/1.4G', 'AF-S NIKKOR 35mm f/1.8G ED', 'AF-S NIKKOR 50mm f/1.4G',
    'AF-S NIKKOR 50mm f/1.8G', 'AF-S NIKKOR 58mm f/1.4G', 'AF-S NIKKOR 70-200mm f/2.8E FL ED VR', 'AF-S NIKKOR 70-200mm f/2.8G ED VR II',
    'AF-S NIKKOR 70-200mm f/4G ED VR', 'AF-P NIKKOR 70-300mm f/4.5-5.6E ED VR', 'AF-S NIKKOR 85mm f/1.4G', 'AF-S NIKKOR 85mm f/1.8G',
    'AF-S NIKKOR 105mm f/1.4E ED', 'AF-S VR Micro-NIKKOR 105mm f/2.8G IF-ED', 'AF-S NIKKOR 200-500mm f/5.6E ED VR',
    'AF NIKKOR 50mm f/1.8D', 'AF NIKKOR 85mm f/1.8D', 'AF NIKKOR 28mm f/2.8D', 'AF NIKKOR 35mm f/2D', 'AF DC-NIKKOR 135mm f/2D',
    'NIKKOR 20mm f/2.8 AI-S', 'NIKKOR 24mm f/2.8 AI-S', 'NIKKOR 28mm f/2.8 AI-S', 'NIKKOR 35mm f/1.4 AI-S', 'NIKKOR 35mm f/2 AI-S',
    'NIKKOR 45mm f/2.8 P', 'NIKKOR 50mm f/1.2 AI-S', 'NIKKOR 50mm f/1.4 AI-S', 'NIKKOR 50mm f/1.8 AI-S', 'NIKKOR 85mm f/1.4 AI-S',
    'NIKKOR 105mm f/2.5 AI-S', 'NIKKOR 135mm f/2.8 AI-S', 'NIKKOR 180mm f/2.8 ED AI-S', 'Series E 50mm f/1.8', 'Series E 100mm f/2.8'
  ]],
  ['Nikon', 'F-DX', [
    'AF-S DX NIKKOR 10-20mm f/4.5-5.6G VR', 'AF-S DX NIKKOR 16-80mm f/2.8-4E ED VR', 'AF-S DX NIKKOR 17-55mm f/2.8G ED',
    'AF-P DX NIKKOR 18-55mm f/3.5-5.6G VR', 'AF-S DX NIKKOR 18-140mm f/3.5-5.6G ED VR', 'AF-S DX NIKKOR 18-200mm f/3.5-5.6G ED VR II',
    'AF-S DX NIKKOR 35mm f/1.8G', 'AF-P DX NIKKOR 70-300mm f/4.5-6.3G ED VR', 'AF-S DX Micro NIKKOR 40mm f/2.8G'
  ]],

  // ------------------------------------------------------------------- Sony
  ['Sony', 'E', [
    'FE 12-24mm F2.8 GM', 'FE 12-24mm F4 G', 'FE 14mm F1.8 GM', 'FE 16mm F1.8 G', 'FE 16-25mm F2.8 G', 'FE 16-35mm F2.8 GM II',
    'FE 16-35mm F2.8 GM', 'FE 16-35mm F4 G PZ', 'FE 20mm F1.8 G', 'FE 20-70mm F4 G', 'FE 24mm F1.4 GM', 'FE 24mm F2.8 G',
    'FE 24-50mm F2.8 G', 'FE 24-70mm F2.8 GM II', 'FE 24-70mm F2.8 GM', 'FE 24-70mm F4 ZA OSS', 'FE 24-105mm F4 G OSS',
    'FE 24-240mm F3.5-6.3 OSS', 'FE 28mm F2', 'FE 28-60mm F4-5.6', 'FE 28-70mm F3.5-5.6 OSS', 'FE 28-70mm F2 GM',
    'FE 35mm F1.4 GM', 'FE 35mm F1.8', 'FE 35mm F2.8 ZA', 'FE 40mm F2.5 G', 'FE 50mm F1.2 GM', 'FE 50mm F1.4 GM',
    'FE 50mm F1.4 ZA', 'FE 50mm F1.8', 'FE 50mm F2.5 G', 'FE 50mm F2.8 Macro', 'FE 55mm F1.8 ZA', 'FE 85mm F1.4 GM II',
    'FE 85mm F1.4 GM', 'FE 85mm F1.8', 'FE 90mm F2.8 Macro G OSS', 'FE 100mm F2.8 STF GM OSS', 'FE 135mm F1.8 GM',
    'FE 70-200mm F2.8 GM OSS II', 'FE 70-200mm F2.8 GM OSS', 'FE 70-200mm F4 Macro G OSS II', 'FE 70-200mm F4 G OSS',
    'FE 70-300mm F4.5-5.6 G OSS', 'FE 100-400mm F4.5-5.6 GM OSS', 'FE 200-600mm F5.6-6.3 G OSS', 'FE 300mm F2.8 GM OSS',
    'FE 400-800mm F6.3-8 G OSS', 'FE 600mm F4 GM OSS'
  ]],
  ['Sony', 'E-APSC', [
    'E 10-18mm F4 OSS', 'E PZ 10-20mm F4 G', 'E 11mm F1.8', 'E 15mm F1.4 G', 'E PZ 16-50mm F3.5-5.6 OSS', 'E 16-55mm F2.8 G',
    'E 18-135mm F3.5-5.6 OSS', 'E PZ 18-105mm F4 G OSS', 'E 20mm F2.8', 'E 35mm F1.8 OSS', 'E 50mm F1.8 OSS',
    'E 55-210mm F4.5-6.3 OSS', 'E 70-350mm F4.5-6.3 G OSS', 'Sonnar T* E 24mm F1.8 ZA'
  ]],

  // --------------------------------------------------------------- Fujifilm
  ['FUJIFILM', 'X', [
    'XF8mmF3.5 R WR', 'XF8-16mmF2.8 R LM WR', 'XF10-24mmF4 R OIS WR', 'XF14mmF2.8 R', 'XF16mmF1.4 R WR', 'XF16mmF2.8 R WR',
    'XF16-50mmF2.8-4.8 R LM WR', 'XF16-55mmF2.8 R LM WR II', 'XF16-55mmF2.8 R LM WR', 'XF16-80mmF4 R OIS WR', 'XF18mmF1.4 R LM WR',
    'XF18mmF2 R', 'XF18-55mmF2.8-4 R LM OIS', 'XF18-120mmF4 LM PZ WR', 'XF18-135mmF3.5-5.6 R LM OIS WR', 'XF23mmF1.4 R LM WR',
    'XF23mmF1.4 R', 'XF23mmF2 R WR', 'XF27mmF2.8 R WR', 'XF30mmF2.8 R LM WR Macro', 'XF33mmF1.4 R LM WR', 'XF35mmF1.4 R',
    'XF35mmF2 R WR', 'XF50mmF1.0 R WR', 'XF50mmF2 R WR', 'XF50-140mmF2.8 R LM OIS WR', 'XF55-200mmF3.5-4.8 R LM OIS',
    'XF56mmF1.2 R WR', 'XF56mmF1.2 R', 'XF60mmF2.4 R Macro', 'XF70-300mmF4-5.6 R LM OIS WR', 'XF80mmF2.8 R LM OIS WR Macro',
    'XF90mmF2 R LM WR', 'XF100-400mmF4.5-5.6 R LM OIS WR', 'XF150-600mmF5.6-8 R LM OIS WR', 'XF200mmF2 R LM OIS WR',
    'XC15-45mmF3.5-5.6 OIS PZ', 'XC35mmF2', 'XC50-230mmF4.5-6.7 OIS II'
  ]],
  ['FUJIFILM', 'GF', [
    'GF20-35mmF4 R WR', 'GF23mmF4 R LM WR', 'GF30mmF3.5 R WR', 'GF32-64mmF4 R LM WR', 'GF35-70mmF4.5-5.6 WR', 'GF45mmF2.8 R WR',
    'GF45-100mmF4 R LM OIS WR', 'GF50mmF3.5 R LM WR', 'GF55mmF1.7 R WR', 'GF63mmF2.8 R WR', 'GF80mmF1.7 R WR',
    'GF110mmF2 R LM WR', 'GF120mmF4 R LM OIS WR Macro', 'GF100-200mmF5.6 R LM OIS WR', 'GF250mmF4 R LM OIS WR'
  ]],

  // ------------------------------------------------------- Panasonic / L-mount
  ['Panasonic', 'L', [
    'LUMIX S 14-28/F4-5.6 MACRO', 'LUMIX S 16-35/F4', 'LUMIX S 18-40/F4.5-6.3', 'LUMIX S 18mm F1.8', 'LUMIX S 20-60/F3.5-5.6',
    'LUMIX S 24mm F1.8', 'LUMIX S 24-105/F4 MACRO O.I.S.', 'LUMIX S PRO 24-70/F2.8', 'LUMIX S 28-200/F4-7.1 MACRO O.I.S.',
    'LUMIX S 35mm F1.8', 'LUMIX S 50mm F1.8', 'LUMIX S PRO 50/F1.4', 'LUMIX S 85mm F1.8', 'LUMIX S 100/F2.8 MACRO',
    'LUMIX S PRO 70-200/F2.8 O.I.S.', 'LUMIX S PRO 70-200/F4 O.I.S.', 'LUMIX S 70-300/F4.5-5.6 MACRO O.I.S.',
    'LUMIX S 26mm F8'
  ]],
  ['Panasonic', 'MFT', [
    'LUMIX G VARIO 12-32/F3.5-5.6', 'LUMIX G VARIO 12-60/F3.5-5.6', 'LEICA DG VARIO-ELMARIT 12-60/F2.8-4.0',
    'LEICA DG VARIO-ELMARIT 12-35/F2.8', 'LUMIX G X VARIO 12-35/F2.8 II', 'LEICA DG VARIO-SUMMILUX 10-25/F1.7',
    'LUMIX G 14-140/F3.5-5.6 II', 'LUMIX G 15/F1.7', 'LEICA DG SUMMILUX 15/F1.7', 'LUMIX G 20/F1.7 II', 'LUMIX G 25/F1.7',
    'LEICA DG SUMMILUX 25/F1.4', 'LUMIX G 42.5/F1.7', 'LEICA DG NOCTICRON 42.5/F1.2', 'LEICA DG ELMARIT 200/F2.8',
    'LUMIX G VARIO 100-300/F4.0-5.6 II', 'LEICA DG VARIO-ELMAR 100-400/F4.0-6.3'
  ]],
  ['Leica Camera AG', 'L', [
    'SUMMILUX-SL 1:1.4/50 ASPH.', 'APO-SUMMICRON-SL 1:2/35 ASPH.', 'APO-SUMMICRON-SL 1:2/50 ASPH.', 'APO-SUMMICRON-SL 1:2/75 ASPH.',
    'APO-SUMMICRON-SL 1:2/90 ASPH.', 'VARIO-ELMARIT-SL 1:2.8/24-70 ASPH.', 'VARIO-ELMARIT-SL 1:2.8-4/24-90 ASPH.',
    'APO-VARIO-ELMARIT-SL 1:2.8-4/90-280'
  ]],
  ['SIGMA', 'L', ['45mm F2.8 DG DN | Contemporary 019', '65mm F2 DG DN | Contemporary 020']],

  // ------------------------------------------------------------- OM / Olympus
  ['OM Digital Solutions', 'MFT', [
    'OLYMPUS M.8mm F1.8', 'OLYMPUS M.7-14mm F2.8', 'OLYMPUS M.9-18mm F4.0-5.6', 'OM SYSTEM M.Zuiko Digital ED 8-25mm F4.0 PRO',
    'OLYMPUS M.12mm F2.0', 'OLYMPUS M.12-40mm F2.8 II', 'OLYMPUS M.12-40mm F2.8', 'OLYMPUS M.12-45mm F4.0', 'OLYMPUS M.12-100mm F4.0',
    'OLYMPUS M.14-42mm F3.5-5.6 EZ', 'OLYMPUS M.14-150mm F4.0-5.6 II', 'OLYMPUS M.17mm F1.2', 'OLYMPUS M.17mm F1.8',
    'OLYMPUS M.20mm F1.4', 'OLYMPUS M.25mm F1.2', 'OLYMPUS M.25mm F1.8', 'OLYMPUS M.30mm F3.5 Macro', 'OLYMPUS M.40-150mm F2.8',
    'OLYMPUS M.40-150mm F4.0-5.6 R', 'OM SYSTEM M.40-150mm F4.0', 'OLYMPUS M.45mm F1.2', 'OLYMPUS M.45mm F1.8',
    'OLYMPUS M.60mm F2.8 Macro', 'OLYMPUS M.75mm F1.8', 'OM SYSTEM M.90mm F3.5 Macro IS', 'OLYMPUS M.100-400mm F5.0-6.3',
    'OM SYSTEM M.150-600mm F5.0-6.3', 'OLYMPUS M.300mm F4.0', 'OLYMPUS M.150-400mm F4.5 TC1.25x'
  ]],
  ['Olympus', 'OM', [
    'Zuiko 21mm f/3.5', 'Zuiko 24mm f/2.8', 'Zuiko 28mm f/2.8', 'Zuiko 28mm f/3.5', 'Zuiko 35mm f/2.8', 'Zuiko 50mm f/1.2',
    'Zuiko 50mm f/1.4', 'Zuiko 50mm f/1.8', 'Zuiko 50mm f/3.5 Macro', 'Zuiko 85mm f/2', 'Zuiko 100mm f/2.8', 'Zuiko 135mm f/3.5',
    'Zuiko 35-70mm f/3.5-4.5'
  ]],

  // ------------------------------------------------------------------ Pentax
  ['RICOH IMAGING COMPANY, LTD.', 'K', [
    'HD PENTAX-D FA 15-30mm F2.8ED SDM WR', 'HD PENTAX-D FA 21mm F2.4ED Limited DC WR', 'HD PENTAX-D FA 24-70mm F2.8ED SDM WR',
    'HD PENTAX-D FA 28-105mm F3.5-5.6ED DC WR', 'HD PENTAX-D FA* 50mm F1.4 SDM AW', 'HD PENTAX-D FA* 85mm F1.4ED SDM AW',
    'HD PENTAX-D FA* 70-200mm F2.8ED DC AW', 'HD PENTAX-FA 31mm F1.8 Limited', 'HD PENTAX-FA 43mm F1.9 Limited',
    'HD PENTAX-FA 77mm F1.8 Limited', 'smc PENTAX-FA 50mm F1.4', 'smc PENTAX-M 50mm F1.7', 'smc PENTAX-M 50mm F1.4',
    'smc PENTAX-M 28mm F2.8', 'smc PENTAX-A 50mm F1.7', 'smc PENTAX-A 50mm F2', 'smc PENTAX 55mm F1.8', 'SMC Takumar 50mm F1.4'
  ]],
  ['RICOH IMAGING COMPANY, LTD.', 'K-APSC', [
    'HD PENTAX-DA 15mm F4ED AL Limited', 'HD PENTAX-DA 16-85mm F3.5-5.6ED DC WR', 'HD PENTAX-DA 20-40mm F2.8-4ED Limited DC WR',
    'HD PENTAX-DA 21mm F3.2AL Limited', 'HD PENTAX-DA 35mm F2.8 Macro Limited', 'HD PENTAX-DA 40mm F2.8 Limited',
    'HD PENTAX-DA 70mm F2.4 Limited', 'HD PENTAX-DA* 11-18mm F2.8ED DC AW', 'HD PENTAX-DA* 16-50mm F2.8ED PLM AW',
    'smc PENTAX-DA 18-55mm F3.5-5.6AL WR', 'smc PENTAX-DA 35mm F2.4AL', 'smc PENTAX-DA 50mm F1.8', 'HD PENTAX-DA 55-300mm F4.5-6.3ED PLM WR RE'
  ]],
  ['PENTAX', 'P67', ['SMC Takumar 6x7 55mm F3.5', 'SMC Takumar 6x7 75mm F4.5', 'SMC Takumar 6x7 105mm F2.4', 'SMC Pentax 67 90mm F2.8', 'SMC Pentax 67 165mm F2.8', 'SMC Pentax 67 200mm F4']],
  ['PENTAX', 'P645', ['smc PENTAX-FA 645 45mm F2.8', 'smc PENTAX-FA 645 75mm F2.8', 'smc PENTAX-A 645 75mm F2.8', 'smc PENTAX-FA 645 150mm F2.8']],
  ['PENTAX', 'M42', ['Super-Takumar 50mm F1.4', 'Super-Multi-Coated Takumar 50mm F1.4', 'Super-Takumar 55mm F1.8', 'Super-Takumar 35mm F3.5', 'Super-Takumar 135mm F3.5']],

  // -------------------------------------------------------------- Leica M / R
  ['Leica Camera AG', 'M', [
    'Summilux-M 1:1.4/21 ASPH.', 'Elmarit-M 1:2.8/24 ASPH.', 'Summilux-M 1:1.4/28 ASPH.', 'Summicron-M 1:2/28 ASPH.',
    'Elmarit-M 1:2.8/28 ASPH.', 'Summaron-M 1:5.6/28', 'Summilux-M 1:1.4/35 ASPH.', 'Summicron-M 1:2/35 ASPH.',
    'Summicron-M 1:2/35 (v4)', 'APO-Summicron-M 1:2/35 ASPH.', 'Noctilux-M 1:0.95/50 ASPH.', 'Summilux-M 1:1.4/50 ASPH.',
    'APO-Summicron-M 1:2/50 ASPH.', 'Summicron-M 1:2/50', 'Summarit-M 1:2.4/50', 'Elmar-M 1:2.8/50', 'Summilux-M 1:1.4/75',
    'APO-Summicron-M 1:2/75 ASPH.', 'APO-Summicron-M 1:2/90 ASPH.', 'Elmarit-M 1:2.8/90', 'Tri-Elmar-M 16-18-21 f/4 ASPH.'
  ]],
  ['Leica Camera AG', 'R', ['Summicron-R 1:2/50', 'Summilux-R 1:1.4/50', 'Elmarit-R 1:2.8/28', 'Elmarit-R 1:2.8/90', 'Vario-Elmar-R 35-70mm f/4']],
  ['Leica Camera AG', 'Fixed-FF', ['Summilux 1:1.7/28 ASPH.', 'APO-Summicron 1:2/43 ASPH.']],

  // ------------------------------------------------------------- Hasselblad
  ['Hasselblad', 'XCD', [
    'XCD 3,5/21', 'XCD 4/21', 'XCD 2,5/25V', 'XCD 3,5/30', 'XCD 4/28P', 'XCD 4/35-75', 'XCD 3,5/45', 'XCD 4/45P', 'XCD 2,5/38V',
    'XCD 2,5/55V', 'XCD 1,9/80', 'XCD 2,5/90V', 'XCD 2,8/65', 'XCD 3,5/120 Macro', 'XCD 2,8-4/38-70E', 'XCD 3,2/90'
  ]],
  ['Hasselblad', 'P66', [
    'Distagon C 50mm f/4', 'Distagon CF 50mm f/4 FLE', 'Planar C 80mm f/2.8', 'Planar CF 80mm f/2.8', 'Planar CF 100mm f/3.5',
    'Sonnar C 150mm f/4', 'Sonnar CF 150mm f/4', 'Makro-Planar CF 120mm f/4', 'Biogon C 38mm f/4.5', 'Distagon CF 60mm f/3.5'
  ]],

  // ------------------------------------------------- Medium format film misc
  ['Mamiya', 'P67', [
    'Mamiya Sekor C 50mm f/4.5 (RB67)', 'Mamiya Sekor C 65mm f/4.5 (RB67)', 'Mamiya Sekor C 90mm f/3.8 (RB67)',
    'Mamiya Sekor C 127mm f/3.8 (RB67)', 'Mamiya Sekor C 180mm f/4.5 (RB67)', 'Mamiya Sekor Z 50mm f/4.5 W (RZ67)',
    'Mamiya Sekor Z 65mm f/4 W (RZ67)', 'Mamiya Sekor Z 110mm f/2.8 W (RZ67)', 'Mamiya Sekor Z 180mm f/4.5 W (RZ67)',
    'Mamiya N 43mm f/4.5 L (Mamiya 7)', 'Mamiya N 50mm f/4.5 L (Mamiya 7)', 'Mamiya N 65mm f/4 L (Mamiya 7)',
    'Mamiya N 80mm f/4 L (Mamiya 7)', 'Mamiya N 150mm f/4.5 L (Mamiya 7)'
  ]],
  ['Mamiya', 'P645', [
    'Mamiya Sekor C 45mm f/2.8 N', 'Mamiya Sekor C 55mm f/2.8 N', 'Mamiya Sekor C 80mm f/1.9 N', 'Mamiya Sekor C 80mm f/2.8 N',
    'Mamiya Sekor C 110mm f/2.8 N', 'Mamiya Sekor C 150mm f/3.5 N'
  ]],
  ['Mamiya', 'P66', ['Mamiya Sekor 80mm f/2.8 (C330)', 'Mamiya Sekor 55mm f/4.5 (C330)', 'Mamiya Sekor 135mm f/4.5 (C330)']],
  ['Bronica', 'P66', ['Zenzanon-PS 50mm f/3.5', 'Zenzanon-PS 80mm f/2.8', 'Zenzanon-PS 150mm f/4', 'Zenzanon-S 80mm f/2.8']],
  ['Bronica', 'P645', ['Zenzanon-PE 40mm f/4', 'Zenzanon-PE 75mm f/2.8', 'Zenzanon-PE 150mm f/3.5']],
  ['Zeiss', 'P66', ['Planar 80mm f/2.8 (Rolleiflex)', 'Xenotar 80mm f/2.8 (Rolleiflex)', 'Tessar 75mm f/3.5']],

  // ------------------------------------------- Classic SLR / rangefinder film
  ['Minolta', 'MD', [
    'MC Rokkor-PG 50mm f/1.4', 'MC Rokkor-PF 58mm f/1.4', 'MC Rokkor-X 50mm f/1.7', 'MD Rokkor 50mm f/1.7', 'MD Rokkor-X 45mm f/2',
    'MD Rokkor 28mm f/2.8', 'MD W.Rokkor-X 24mm f/2.8', 'MD Rokkor 85mm f/2', 'MD Tele Rokkor 135mm f/3.5', 'MD Zoom 35-70mm f/3.5'
  ]],
  ['Minolta', 'A', ['AF 50mm f/1.7', 'AF 50mm f/1.4', 'AF 28-85mm f/3.5-4.5', 'AF 35-70mm f/4', 'AF 70-210mm f/4 (Beercan)', 'AF 100mm f/2.8 Macro']],
  ['Zeiss', 'CY', [
    'Distagon T* 25mm f/2.8', 'Distagon T* 28mm f/2.8', 'Distagon T* 35mm f/2.8', 'Planar T* 50mm f/1.4', 'Planar T* 50mm f/1.7',
    'Planar T* 85mm f/1.4', 'Sonnar T* 85mm f/2.8', 'Makro-Planar T* 60mm f/2.8', 'Vario-Sonnar T* 35-70mm f/3.4', 'Yashica ML 50mm f/1.7'
  ]],
  ['Zeiss', 'G', ['Biogon T* 21mm f/2.8 (G)', 'Biogon T* 28mm f/2.8 (G)', 'Planar T* 35mm f/2 (G)', 'Planar T* 45mm f/2 (G)', 'Sonnar T* 90mm f/2.8 (G)']],
  ['Zeiss', 'M', ['Biogon T* 2,8/21 ZM', 'Biogon T* 2,8/28 ZM', 'Biogon T* 2/35 ZM', 'Sonnar T* 1,5/50 ZM', 'Planar T* 2/50 ZM', 'C Sonnar T* 1,5/50 ZM']],
  ['Zeiss', 'E', ['Batis 2/25', 'Batis 1.8/40 CF', 'Batis 1.8/85', 'Batis 2.8/135', 'Loxia 2/35', 'Loxia 2/50', 'Loxia 2.4/85']],
  ['Helios', 'M42', ['Helios-44-2 58mm f/2', 'Helios-44M-4 58mm f/2', 'Jupiter-9 85mm f/2', 'Jupiter-37A 135mm f/3.5', 'Mir-1B 37mm f/2.8', 'Industar-50-2 50mm f/3.5']],

  // ------------------------------------------------------------ Third party
  ['SIGMA', 'E', [
    '14mm F1.4 DG DN | Art 023', '14-24mm F2.8 DG DN | Art 019', '16-28mm F2.8 DG DN | Contemporary 022', '20mm F1.4 DG DN | Art 022',
    '24mm F1.4 DG DN | Art 022', '24-70mm F2.8 DG DN II | Art 024', '24-70mm F2.8 DG DN | Art 019', '28-70mm F2.8 DG DN | Contemporary 021',
    '28-105mm F2.8 DG DN | Art 023', '35mm F1.2 DG DN | Art 019', '35mm F1.4 DG DN | Art 021', '35mm F2 DG DN | Contemporary 020',
    '40mm F1.4 DG HSM | Art 018', '50mm F1.2 DG DN | Art 024', '50mm F1.4 DG DN | Art 023', '85mm F1.4 DG DN | Art 020',
    '105mm F2.8 DG DN MACRO | Art 020', '135mm F1.4 DG | Art 025', '70-200mm F2.8 DG DN OS | Sports 023',
    '100-400mm F5-6.3 DG DN OS | Contemporary 020', '150-600mm F5-6.3 DG DN OS | Sports 022', '500mm F5.6 DG DN OS | Sports 024'
  ]],
  ['SIGMA', 'E-APSC', [
    '10-18mm F2.8 DC DN | Contemporary 023', '16mm F1.4 DC DN | Contemporary 017', '18-50mm F2.8 DC DN | Contemporary 021',
    '23mm F1.4 DC DN | Contemporary 023', '30mm F1.4 DC DN | Contemporary 016', '56mm F1.4 DC DN | Contemporary 018'
  ]],
  ['SIGMA', 'EF', [
    '14mm F1.8 DG HSM | Art 017', '18-35mm F1.8 DC HSM | Art 013', '24-70mm F2.8 DG OS HSM | Art 017', '35mm F1.4 DG HSM | Art 012',
    '50mm F1.4 DG HSM | Art 014', '85mm F1.4 DG HSM | Art 016', '105mm F1.4 DG HSM | Art 018', '135mm F1.8 DG HSM | Art 017',
    '150-600mm F5-6.3 DG OS HSM | Contemporary 015'
  ]],
  ['SIGMA', 'X', ['18-50mm F2.8 DC DN | Contemporary 021', '16mm F1.4 DC DN | Contemporary 017', '30mm F1.4 DC DN | Contemporary 016', '56mm F1.4 DC DN | Contemporary 018']],
  ['TAMRON', 'E', [
    '17-28mm F/2.8 Di III RXD', '17-50mm F/4 Di III VXD', '20-40mm F/2.8 Di III VXD', '28-75mm F/2.8 Di III VXD G2',
    '28-75mm F/2.8 Di III RXD', '28-200mm F/2.8-5.6 Di III RXD', '35-150mm F/2-2.8 Di III VXD', '50-400mm F/4.5-6.3 Di III VC VXD',
    '70-180mm F/2.8 Di III VXD G2', '70-300mm F/4.5-6.3 Di III RXD', '150-500mm F/5-6.7 Di III VC VXD', '90mm F/2.8 Di III MACRO VXD'
  ]],
  ['TAMRON', 'E-APSC', ['11-20mm F/2.8 Di III-A RXD', '17-70mm F/2.8 Di III-A VC RXD', '18-300mm F/3.5-6.3 Di III-A VC VXD']],
  ['TAMRON', 'Z', ['28-75mm F/2.8 Di III VXD G2', '35-150mm F/2-2.8 Di III VXD', '70-300mm F/4.5-6.3 Di III RXD', '150-500mm F/5-6.7 Di III VC VXD']],
  ['TAMRON', 'EF', ['SP 24-70mm F/2.8 Di VC USD G2', 'SP 70-200mm F/2.8 Di VC USD G2', 'SP 15-30mm F/2.8 Di VC USD G2', 'SP 90mm F/2.8 Di MACRO 1:1 VC USD', '28-75mm F/2.8 XR Di']],
  ['Tokina', 'EF', ['atx-i 11-16mm F2.8 CF', 'atx-i 11-20mm F2.8 CF', 'opera 50mm F1.4 FF', 'atx-m 85mm F1.8 FE']],
  ['Tokina', 'X', ['atx-m 23mm F1.4 X', 'atx-m 33mm F1.4 X', 'atx-m 56mm F1.4 X']],
  ['Samyang', 'E', ['AF 14mm F2.8 FE', 'AF 24mm F1.8 FE', 'AF 35mm F1.4 FE II', 'AF 35mm F1.8 FE', 'AF 45mm F1.8 FE', 'AF 50mm F1.4 FE II', 'AF 75mm F1.8 FE', 'AF 85mm F1.4 FE II', 'AF 135mm F1.8 FE', 'AF 35-150mm F2-2.8 FE']],
  ['Samyang', 'Fixed', ['MF 14mm F2.8 ED AS IF UMC', 'MF 8mm F3.5 Fisheye CS II', 'MF 85mm F1.4 AS IF UMC', 'MF 135mm F2.0 ED UMC']],
  ['Viltrox', 'E', ['AF 16mm F1.8 FE', 'AF 20mm F2.8 FE', 'AF 24mm F1.8 FE', 'AF 28mm F1.8 FE', 'AF 35mm F1.8 FE', 'AF 40mm F2.5 FE', 'AF 50mm F1.8 FE', 'AF 85mm F1.8 FE II', 'AF 135mm F1.8 LAB FE']],
  ['Viltrox', 'X', ['AF 13mm F1.4 XF', 'AF 23mm F1.4 XF', 'AF 27mm F1.2 Pro XF', 'AF 33mm F1.4 XF', 'AF 56mm F1.4 XF', 'AF 75mm F1.2 Pro XF']],
  ['Voigtländer', 'M', [
    'Ultra Wide-Heliar 12mm F5.6 Aspherical III', 'Super Wide-Heliar 15mm F4.5 Aspherical III', 'Color-Skopar 21mm F3.5 Aspherical',
    'Ultron 28mm F2 Aspherical', 'Color-Skopar 28mm F2.8 Aspherical', 'Nokton classic 35mm F1.4', 'Nokton 35mm F1.2 Aspherical III',
    'Ultron 35mm F2 Aspherical', 'Color-Skopar 35mm F2.5 PII', 'Nokton 40mm F1.2 Aspherical', 'Nokton classic 40mm F1.4',
    'Nokton 50mm F1.2 Aspherical', 'Nokton 50mm F1.5 Aspherical II', 'APO-Lanthar 50mm F2 Aspherical', 'Heliar 50mm F3.5',
    'Nokton 75mm F1.5 Aspherical', 'APO-Skopar 90mm F2.8'
  ]],
  ['Voigtländer', 'E', ['NOKTON 10.5mm F0.95', 'APO-LANTHAR 35mm F2', 'NOKTON 40mm F1.2 Aspherical', 'APO-LANTHAR 50mm F2', 'APO-LANTHAR 65mm F2 Macro', 'MACRO APO-LANTHAR 110mm F2.5']],
  ['Voigtländer', 'Z', ['NOKTON 23mm F1.2 Aspherical', 'NOKTON 40mm F1.2 Aspherical SE', 'APO-LANTHAR 50mm F2 Aspherical']],
  ['LAOWA', 'E', ['10mm f/2.8 Zero-D FF', '12mm f/2.8 Zero-D', '15mm f/2 Zero-D', '24mm f/14 2x Macro Probe', '90mm f/2.8 2x Ultra Macro APO', '100mm f/2.8 2x Ultra Macro APO']],
  ['LAOWA', 'MFT', ['7.5mm f/2 MFT', '10mm f/2 Zero-D MFT', '17mm f/1.8 MFT', '50mm f/2.8 2x Ultra Macro APO']],
  ['TTArtisan', 'M', ['TTArtisan 21mm f/1.5 ASPH', 'TTArtisan 28mm f/5.6', 'TTArtisan 35mm f/1.4 ASPH', 'TTArtisan 35mm f/2', 'TTArtisan 50mm f/0.95 ASPH', 'TTArtisan 50mm f/1.4 ASPH', 'TTArtisan 50mm f/2', 'TTArtisan 90mm f/1.25']],
  ['TTArtisan', 'X', ['TTArtisan 7.5mm f/2 Fisheye', 'TTArtisan 17mm f/1.4', 'TTArtisan 23mm f/1.4', 'TTArtisan 27mm f/2.8 AF', 'TTArtisan 35mm f/1.4 C', 'TTArtisan 50mm f/1.2 C']],
  ['7Artisans', 'X', ['7Artisans 12mm f/2.8', '7Artisans 25mm f/1.8', '7Artisans 35mm f/1.2 II', '7Artisans 50mm f/1.8', '7Artisans 55mm f/1.4 II', '7Artisans 60mm f/2.8 Macro']],
  ['7Artisans', 'M', ['7Artisans 28mm f/1.4 FE+', '7Artisans 35mm f/2', '7Artisans 50mm f/1.1', '7Artisans 75mm f/1.25']],
  ['SIRUI', 'X', ['Sniper 23mm f/1.2', 'Sniper 33mm f/1.2', 'Sniper 56mm f/1.2', 'Aurora 85mm f/1.4']],
  ['Meike', 'E', ['Meike 50mm f/1.8 STM', 'Meike 85mm f/1.8 STM', 'Meike 25mm f/1.8', 'Meike 35mm f/1.7']]
]

export const LENSES: LensModel[] = GROUPS.flatMap(([make, mount, models]) => models.map((model) => ({ make, model, mount }))).filter(
  (l, i, arr) => arr.findIndex((o) => o.make === l.make && o.model === l.model) === i
)

export const LENS_MAKES: string[] = Array.from(new Set(LENSES.map((l) => l.make))).sort((a, b) => a.localeCompare(b))

export interface LensSpecs {
  minFocal?: number
  maxFocal?: number
  /** Widest f-number at the short end ("18-55mm f/3.5-5.6" → 3.5). */
  wideAperture?: number
  /** Widest f-number at the long end ("18-55mm f/3.5-5.6" → 5.6; equal to wideAperture for constant-aperture lenses). */
  teleAperture?: number
  /** Teleconverter factor baked into the name ("+RF1.4x", "+2x III"). */
  extender?: number
}

/** Pull focal length & max aperture out of a lens name ("RF24-70mm F2.8 L", "1:2/35", "XCD 2,5/55V"). */
export function parseLensSpecs(name: string): LensSpecs {
  let s = name.replace(/(\d),(\d)/g, '$1.$2')
  const out: LensSpecs = {}

  const ext = /\+\s*(?:RF\s*)?(1\.4|2)\s*x/i.exec(s)
  if (ext) {
    out.extender = parseFloat(ext[1])
    s = s.slice(0, ext.index)
  }
  const builtIn = /Extender\s+(1\.4)x/i.exec(s)

  const focal = /(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*mm/i.exec(s)
  // Panasonic style "LUMIX S 20-60/F3.5-5.6", "LUMIX G 15/F1.7"
  const lumix = focal ? null : /(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?\/F(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?/i.exec(s)
  if (lumix) {
    out.minFocal = parseFloat(lumix[1])
    out.maxFocal = lumix[2] ? parseFloat(lumix[2]) : out.minFocal
    out.wideAperture = parseFloat(lumix[3])
    out.teleAperture = lumix[4] ? parseFloat(lumix[4]) : out.wideAperture
  } else if (focal) {
    out.minFocal = parseFloat(focal[1])
    out.maxFocal = focal[2] ? parseFloat(focal[2]) : out.minFocal
    const rest = s.slice(0, focal.index) + ' ' + s.slice(focal.index + focal[0].length)
    const ap = /(?:^|[^A-Za-z])F\s?\/?\s?(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?|(?:^|\s)f\/(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?/i.exec(rest)
    if (ap) {
      const a = ap[1] ?? ap[3]
      const b = ap[2] ?? ap[4]
      out.wideAperture = parseFloat(a)
      out.teleAperture = b ? parseFloat(b) : out.wideAperture
    }
  } else {
    // Leica / Zeiss / Hasselblad style "1:2/35", "1:2.8-4/24-90", "2.8/21 ZM", "XCD 2.5/55V"
    const leica = /(?:1:)?(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?\/(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?/.exec(s)
    if (leica) {
      out.wideAperture = parseFloat(leica[1])
      out.teleAperture = leica[2] ? parseFloat(leica[2]) : out.wideAperture
      out.minFocal = parseFloat(leica[3])
      out.maxFocal = leica[4] ? parseFloat(leica[4]) : out.minFocal
    }
  }

  if (out.extender && out.minFocal !== undefined) {
    const k = out.extender
    out.minFocal *= k
    out.maxFocal = (out.maxFocal ?? out.minFocal / k) * k
    if (out.wideAperture) out.wideAperture *= k
    if (out.teleAperture) out.teleAperture *= k
  } else if (builtIn && out.maxFocal !== undefined) {
    // e.g. EF200-400mm f/4L IS USM Extender 1.4x: engaged extender reaches 560mm f/5.6
    out.maxFocal *= 1.4
  }
  return out
}

export function isPrime(spec: LensSpecs): boolean {
  return spec.minFocal !== undefined && spec.minFocal === spec.maxFocal
}

export function findLens(model: string | null | undefined): LensModel | undefined {
  if (!model) return undefined
  const m = model.trim().toLowerCase()
  const stripped = m.replace(/^canon\s+/, '')
  return LENSES.find((l) => {
    const lm = l.model.toLowerCase()
    return lm === m || lm === stripped
  })
}
