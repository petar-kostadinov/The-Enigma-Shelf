export interface UserForAuth {
  email: string;
  username: string;
  password: string;
}

export interface User {
  _id: string;
  email: string;
  username: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
