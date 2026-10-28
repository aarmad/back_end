import { MongoClient } from "mongodb";
import { env } from "./env";
import type { WishlistDocument } from "../models/wishlist";

export const mongoClient = new MongoClient(env.mongo.url);
export const mongoDb = mongoClient.db(env.mongo.database);
export const wishlists = mongoDb.collection<WishlistDocument>("wishlists");
