// UUID v4 (RFC 9562): 122 random bits, version 4 and the RFC variant.
// getRandomValues is available on plain HTTP LAN development origins, where
// crypto.randomUUID is absent. No insecure random source or fallback is used.
export function createUUID() {
	const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
