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
    8
  )} ${numbers.slice(8, 10)}`;
}

export function formatPostalCode(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 5);

  if (numbers.length <= 3) {
    return numbers;
  }

  return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
}