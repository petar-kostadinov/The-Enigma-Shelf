export interface BookOwner {
  _id: string;
  email: string;
  username: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  rating?: number;
  series?: string;
  summary?: string;
  owner?: BookOwner;
  likes: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BookCreatePayload {
  title: string;
  author: string;
  genre: string;
  rating?: number;
  series?: string;
  summary?: string;
}
