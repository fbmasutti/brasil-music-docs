// Monta o payload "Pix Copia e Cola" (BR Code, padrão EMV do Banco Central) sem
// depender de nenhuma API externa — só formatação de string + CRC16.
// Referência: Manual de Padrões para Iniciação do Pix (BCB).

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

// Remove acentos e qualquer caractere fora do alfabeto restrito que o Pix aceita
// nesses campos (letras, números e alguns símbolos, tudo em maiúsculas ASCII).
function sanitize(text: string, maxLength: number): string {
  const stripped = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .toUpperCase();
  return stripped.slice(0, maxLength) || "STAGEKIT";
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type PixChargeInput = {
  key: string;
  receiverName: string;
  city: string;
  amount?: number | null | undefined;
  description?: string | undefined;
  txid?: string | undefined;
};

/** Gera o payload Pix (string "copia e cola", que também vira o conteúdo do QR Code). */
export function buildPixPayload({
  key,
  receiverName,
  city,
  amount,
  description,
  txid,
}: PixChargeInput): string {
  const merchantAccount =
    tlv("00", "br.gov.bcb.pix") +
    tlv("01", key.trim()) +
    (description ? tlv("02", sanitize(description, 40)) : "");

  const additionalData = tlv("05", sanitize(txid || "***", 25));

  let payload =
    tlv("00", "01") +
    tlv("01", "11") +
    tlv("26", merchantAccount) +
    tlv("52", "0000") +
    tlv("53", "986");

  if (amount && amount > 0) {
    payload += tlv("54", amount.toFixed(2));
  }

  payload +=
    tlv("58", "BR") +
    tlv("59", sanitize(receiverName, 25)) +
    tlv("60", sanitize(city, 15)) +
    tlv("62", additionalData);

  payload += "6304";
  return payload + crc16(payload);
}
