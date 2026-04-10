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
  rating?: number;
  communityRating?: number | null;
  series?: string;
  summary?: string;
  imageUrl?: string;
  owner?: BookOwner;
  likes: string[];
  votes?: BookVote[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBook {
  title: string;
  author: string;
  genre: string;
  imageUrl: string;
  rating?: number;
  series?: string;
  summary?: string;
}
