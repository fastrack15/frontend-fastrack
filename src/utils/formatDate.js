export function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

export function formatDateWithDay(dateString) {
  if (!dateString) return "-";

  const dates = new Date(dateString);

  if (Number.isNaN(dates.getTime())) return "-";

  const options = { timeZone: "UTC" };

  const day = dates.toLocaleDateString("id-ID", {
    ...options,
    weekday: "long",
  });
  const date = String(dates.getUTCDate()).padStart(2, "0");
  const month = dates.toLocaleDateString("id-ID", {
    ...options,
    month: "long",
  });
  const year = dates.getUTCFullYear();

  return `${day}, ${date} ${month} ${year}`;
}
