import { stationGeography } from "./stations";
import { surabayaStationFallback } from "./surabaya";

export function stationInformation(name: string) {
  const welang = stationGeography.find(station => station.name === name);
  const surabaya = surabayaStationFallback.find(station => station.name === name);
  return {
    latitude: welang?.latitude ?? surabaya?.latitude ?? null,
    longitude: welang?.longitude ?? surabaya?.longitude ?? null,
    region: welang ? "DAS Welang · Pasuruan, Jawa Timur" : "Sistem sungai dan saluran Surabaya · Jawa Timur",
    description: welang?.description ?? (name === "Rumah Pompa Pucang"
      ? "Rumah Pompa Pucang Anom, Surabaya Timur merupakan infrastruktur pengendalian banjir yang berfungsi untuk membantu mengalirkan dan membuang kelebihan air dari kawasan sekitarnya. Fasilitas ini mendukung sistem drainase perkotaan dalam mengurangi risiko genangan, terutama saat curah hujan tinggi, serta menjaga kelancaran aliran air di wilayah Surabaya Timur."
      : "Stasiun pemantauan sungai dan saluran perkotaan Surabaya. Parameter dan satuan pengamatan mengikuti konfigurasi sumber sensor."),
    coordinateSource: welang ? "Metadata lokasi proyek" : "Tautan lokasi stasiun",
    coordinateSourceUrl: surabaya?.coordinateSource ?? null,
    coordinateConfidence: welang ? `${welang.confidence} (metadata lokasi)` : surabaya?.coordinateVerified ? "Terverifikasi" : "Belum diverifikasi di lapangan",
  };
}
