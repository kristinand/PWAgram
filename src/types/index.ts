export interface ICard {
  id: string;
  title: string;
  location: string;
  image: string;
}

export enum EStores {
  Posts = 'posts',
  SyncPosts = 'sync-posts',
}
