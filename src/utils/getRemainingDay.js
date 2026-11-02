function getDayNumber(value) {
  if (!value) return null;

  const datePart = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (datePart) {
    const [, year, month, day] = datePart;
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );

    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      return null;
    }

    return Math.floor(date.getTime() / 86_400_000);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

export function getRemainingDay(defect) {
  const targetDay = getDayNumber(defect?.target);
  if (targetDay === null) return "-";

  const referenceDate = defect.created_perbaikan || new Date();
  const referenceDay = getDayNumber(referenceDate);
  if (referenceDay === null) return "-";

  const difference = targetDay - referenceDay;

  if (difference >= 0) return `${difference} hari tersisa`;
  return `sudah terlewat ${Math.abs(difference)} hari`;
}
