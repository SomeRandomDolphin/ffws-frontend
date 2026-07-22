export const WATER_LEVEL_STATIONS = [
  ["Dhompo", "dhompo"],
  ["Purwodadi", "purwodadi"],
  ["Bd. Suwoto", "bd_suwoto"],
  ["Krajan Timur", "krajan_timur"],
  ["Bd. Lecari", "bd_lecari"],
  ["Bd. Bakalan", "bd_bakalan"],
  ["Bd. Baong", "bd_baong"],
  ["AWLR Kademungan", "awlr_kademungan"],
  ["Bd. Guyangan", "bd_guyangan"],
  ["Sidogiri", "sidogiri"],
  ["Bd. Domas", "bd_domas"],
  ["Klosod", "klosod"],
  ["Bd. Grinting", "bd_grinting"],
];

export const stationLabel = (slug) =>
  WATER_LEVEL_STATIONS.find(([, value]) => value === slug)?.[0] || slug;
