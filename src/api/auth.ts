import { postJson } from "./client";
import { createRegisterCrypto } from "../crypto/webcrypto";
import type { LoginRequest, LoginUserResponse, RegisterForm, RegisterRequest } from "../types/auth";

export async function registerUser(form: RegisterForm) {

  const { pubEcdhJwk, vault } = await createRegisterCrypto(form.password);

  const req: RegisterRequest = {
    email: form.email,
    username: form.username,
    password: form.password,
    rePassword: form.rePassword,
    pubEcdhJwk,
    vault,
  };

  return postJson<{ status: string }>("api/auth/sign-up", req);
}

export async function loginUser(req: LoginRequest) {
  return postJson<LoginUserResponse>("api/auth/login", req);
}
