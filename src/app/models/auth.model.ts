export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}
