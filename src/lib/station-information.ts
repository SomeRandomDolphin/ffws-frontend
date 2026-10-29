import { stationGeography } from "./stations";
import { surabayaStationFallback } from "./surabaya";

const surabayaDescriptions: Record<string, string> = {
  "Hang Tuah": "Stasiun Hang Tuah terletak di depan Kampus Universitas Hang Tuah, kawasan Keputih, Surabaya. Stasiun ini dilengkapi sensor untuk memantau tinggi muka air, curah hujan, aliran air, kecepatan dan arah angin, serta intensitas cahaya guna mendukung pengamatan kondisi lingkungan dan perairan di sekitar lokasi.",
  // Location reference: https://ebuilding.surabaya.go.id/page/gedung/ap-rpm-0034
  "Kalibokor": "Stasiun Kalibokor berada di kawasan Rumah Pompa Kalibokor, Jalan Keputih Timur, Surabaya. Dua kanal sensor, Pompa 1 dan Pompa 2, memantau tinggi muka air, sementara penakar hujan mencatat curah hujan dan jumlah tip untuk membantu pengamatan kondisi air di sekitar fasilitas.",
  "Rumah Pompa Pucang": "Stasiun ini berada di lokasi pemantauan Rumah Pompa Pucang, Surabaya, untuk mengamati kondisi muka air di sekitar fasilitas pompa. Pengukuran dilakukan melalui dua kanal sensor, Pompa 1 dan Pompa 2, serta dilengkapi pencatatan curah hujan untuk menelusuri perubahan kondisi air saat hujan.",
  "Sebrang Perpustakaan Jawa Timur": "Stasiun ini berada di seberang Perpustakaan Jawa Timur, kawasan Jalan Menur Pumpungan, Surabaya. Sensor jarak digunakan untuk memantau tinggi muka air, dengan riwayat pengamatan yang membantu pengguna menelusuri perubahan kondisi perairan di sekitar lokasi.",
};

export function stationInformation(name: string) {
  const welang = stationGeography.find(station => station.name === name);
  const surabaya = surabayaStationFallback.find(station => station.name === name);
  return {
    latitude: welang?.latitude ?? surabaya?.latitude ?? null,
    longitude: welang?.longitude ?? surabaya?.longitude ?? null,
    region: welang ? "DAS Welang · Pasuruan, Jawa Timur" : "Sistem sungai dan saluran Surabaya · Jawa Timur",
    description: welang?.description ?? surabayaDescriptions[name] ?? "Stasiun pemantauan sungai dan saluran perkotaan Surabaya. Riwayat pengamatan menyediakan informasi perubahan kondisi pada lokasi pemantauan.",
    coordinateSource: welang ? "Metadata lokasi proyek" : "Tautan lokasi stasiun",
    coordinateSourceUrl: surabaya?.coordinateSource ?? null,
    coordinateConfidence: welang ? `${welang.confidence} (metadata lokasi)` : surabaya?.coordinateVerified ? "Terverifikasi" : "Belum diverifikasi di lapangan",
  };
}
