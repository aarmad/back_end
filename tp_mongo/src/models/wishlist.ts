// Forme d'un document de la collection MongoDB `wishlists` (voir database/mongodb/wishlists.schema.json)

export interface WishlistItem {
  gameId: string;
  addedAt: Date;
  note?: string;
  details?: Record<string, unknown>; // champs personnels libres : priorité, tags, prix visé...
  noteUpdatedAt?: Date;
}

export interface WishlistDocument {
  userId: string;
  games: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}
