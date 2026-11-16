export function capitalizeFirstLetter(value: string): string {
  return value.replace(/^\s*\S/, (match) => match.toUpperCase());
}

export function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 10);

  if (numbers.length <= 3) {
    return numbers;
  }

  if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }

  if (numbers.length <= 8) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)} ${numbers.slice(6)}`;
  }

  return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)} ${numbers.slice(
    6,
    8,
  )} ${numbers.slice(8, 10)}`;
}

export function formatPostalCode(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 5);

  if (numbers.length <= 3) {
    return numbers;
  }

  return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
}

export function formatTime(value: string | null) {
  if (!value) return "–";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "–"
    : date.toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function formatDistance(metres: number) {
  if (metres < 1_000) {
    return `${Math.max(10, Math.round(metres / 10) * 10)} m`;
  }

  return `${(metres / 1_000).toFixed(1).replace(".", ",")} km`;
}
