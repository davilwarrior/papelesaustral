const DEFAULT_MESSAGE =
  "Hola, quiero cotizar papel para un proyecto. ¿Me pueden ayudar?";

export function buildWhatsAppQuoteUrl(
  whatsappNumber: string,
  message: string = DEFAULT_MESSAGE,
): string {
  const sanitized = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
}
