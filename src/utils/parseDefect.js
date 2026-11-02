export function toDefectRow(defect) {
  return {
    ...defect,
    lingkup: defect.lingkup ?? "-",
    jalur: defect.sublingkup ?? "-",
    status: defect.status ?? "-",
    // Teks pencarian dihitung sekali, bukan setiap ketikan
    searchText: Object.values(defect)
      .map((value) => String(value ?? ""))
      .join(" ")
      .toLowerCase(),
  };
}
