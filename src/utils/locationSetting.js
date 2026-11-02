export const locationSetting = (location) => {
  // Tangani lokasi kosong, null, undefined, atau bukan string.
  if (typeof location !== "string" || !location.trim()) {
    return "-";
  }

  const data = location.trim().split(/\s+/);

  const first = data[0].toUpperCase();
  let second = data[1];

  // Jika hanya ada satu bagian lokasi, tampilkan bagian pertama saja.
  if (!second) {
    return first;
  }

  if (second.includes("+")) {
    const parts = second.split("+");
    const prefix = parts[0];
    const suffix = parts[1];

    // Tambahkan angka 0 jika suffix terdiri dari 2 karakter.
    if (suffix && suffix.length === 1) {
      second = `${prefix}+${suffix}00`;
    } else if (suffix && suffix.length === 2) {
      second = `${prefix}+${suffix}0`;
    }
  } else {
    // Tambahkan +000 jika belum memiliki tanda +.
    second = `${second}+000`;
  }

  return `${first} ${second}`;
};
