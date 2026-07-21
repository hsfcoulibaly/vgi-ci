export function normalizePhone(tel: string, defaultCountry = "225"): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith(defaultCountry)) return "+" + digits;
  if (digits.startsWith("+")) return digits;
  return `+${defaultCountry}${digits}`;
}

export function whatsappLink(tel: string, message: string): string {
  const phone = normalizePhone(tel).replace("+", "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
