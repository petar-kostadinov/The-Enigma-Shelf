export interface BookOwner {
  _id: string;
  email: string;
  username: string;
}

export interface BookVote {
  user: string | BookOwner;
  score: number;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  communityRating?: number | null;
  series?: string;
  summary?: string;
  imageUrl?: string;
  owner?: BookOwner;
  likes: string[];
  votes?: BookVote[];
  createdAt?: string;
  updatedAt?: string;
  /** Само за собственика: маркер „още не съм я чел/ял“. */
  unread?: boolean;
}

export interface CreateBook {
  title: string;
  author: string;
  genre: string;
  imageUrl: string;
  series?: string;
  summary?: string;
  unread?: boolean;
}

/** Same fields as create; used for PUT /books/:id */
export type UpdateBook = CreateBook;
