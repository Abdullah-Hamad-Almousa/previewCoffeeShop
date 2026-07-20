// Random Riyadh locations for order delivery address generation

export interface RiyadhArea {
  name_en: string;
  name_ar: string;
  lat: number;
  lng: number;
}

// 15 real Riyadh districts/areas with approximate coordinates
export const RIYADH_AREAS: RiyadhArea[] = [
  { name_en: 'Olaya', name_ar: 'العليا', lat: 24.6877, lng: 46.6857 },
  { name_en: 'Al Malqa', name_ar: 'الملقا', lat: 24.8253, lng: 46.6454 },
  { name_en: 'King Fahd District', name_ar: 'حي الملك فهد', lat: 24.7136, lng: 46.6753 },
  { name_en: 'Al Murabba', name_ar: 'المربعة', lat: 24.6489, lng: 46.7097 },
  { name_en: 'Al Zahra', name_ar: 'الزهرة', lat: 24.6639, lng: 46.7286 },
  { name_en: 'Al Nakheel', name_ar: 'النخيل', lat: 24.7544, lng: 46.6306 },
  { name_en: 'Al Mohammadiyyah', name_ar: 'المحمدية', lat: 24.7533, lng: 46.5939 },
  { name_en: 'Al Sulaimaniya', name_ar: 'السليمانية', lat: 24.6891, lng: 46.6083 },
  { name_en: 'Al Batha', name_ar: 'البطحاء', lat: 24.6494, lng: 46.7253 },
  { name_en: 'Diriyah', name_ar: 'الدرعية', lat: 24.7544, lng: 46.5722 },
  { name_en: 'Namar', name_ar: 'نمار', lat: 24.5800, lng: 46.6500 },
  { name_en: 'Al Shifa', name_ar: 'الشفا', lat: 24.5500, lng: 46.6800 },
  { name_en: 'Al Yasmin', name_ar: 'الياسمين', lat: 24.8300, lng: 46.6700 },
  { name_en: 'Al Qadisiyah', name_ar: 'القدسية', lat: 24.6700, lng: 46.7400 },
  { name_en: 'Al Wurud', name_ar: 'الورود', lat: 24.7100, lng: 46.6400 },
];

/** Pick a random Riyadh area for the order delivery location */
export function getRandomRiyadhArea(): RiyadhArea {
  const idx = Math.floor(Math.random() * RIYADH_AREAS.length);
  return RIYADH_AREAS[idx];
}