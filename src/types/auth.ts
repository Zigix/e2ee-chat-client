export type VaultDto = {
  version: number;
  kdfSaltB64: string;
  kdfIterations: number;
  wrappedMkB64: string;
  wrappedMkIvB64: string;
  wrappedEcdhPrivB64: string;
  wrappedEcdhPrivIvB64: string;
};

export type RegisterRequest = {
  email: string;
  username: string;
  password: string;
  rePassword: string;
  pubEcdhJwk: string;
  vault: VaultDto;
};

export type LoginRequest = { username: string; password: string };
export type LoginUserResponse = {
  accessToken: string;
  userId: number;
  username: string;
  pubEcdhJwk: string;
  vaultDto: VaultDto;
};
export type ApiValidationError = { field: string; error: string };
export type ApiErrorResponse = {
  message?: string;
  errors?: ApiValidationError[];
};

export type RegisterForm = {
  email: string;
  username: string;
  password: string;
  rePassword: string;
};