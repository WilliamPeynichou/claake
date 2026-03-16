export const ENCRYPTION_SERVICE = Symbol("ENCRYPTION_SERVICE");

export interface EncryptionServicePort {
	encrypt(plaintext: string): string;
	decrypt(encrypted: string): string;
}
