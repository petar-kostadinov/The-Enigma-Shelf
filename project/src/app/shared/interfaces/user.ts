export interface UserForAuth {
  email: string;
  username: string;
  password: string;
  repeatPassword?: string;
}

export interface User {
  _id: string;
  email: string;
  username: string;
}
