export interface TokenStoreInterface {
  getToken(serviceName: string, key: string): Promise<string | null>;
  setToken(serviceName: string, key: string, value: string): Promise<void>;
  deleteToken(serviceName: string, key: string): Promise<void>;
  rotateKey(oldKey: string, newKey: string): Promise<number>;
  auditLog(serviceName: string, action: string, userEmail?: string): Promise<void>;
}