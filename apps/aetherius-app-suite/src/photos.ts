import { createHash } from "node:crypto";

import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Photos core.
 *
 * Albums, metadata, tags, favourites, search and duplicate detection. The
 * library stores metadata only; it does not decode pixels, run face
 * recognition or claim an image editor. `contentHash` is supplied by the host
 * from the file bytes, so duplicate detection is real when the host is honest
 * about the hash.
 */

export interface Album {
  id: string;
  name: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  filename: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  takenAt: string;
  albumId: string | null;
  tags: string[];
  favorite: boolean;
  caption: string;
  contentHash: string;
  addedAt: string;
}

export interface AddPhotoInput {
  filename: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  takenAt: string;
  albumId?: string | null;
  tags?: string[];
  favorite?: boolean;
  caption?: string;
  contentHash: string;
}

export interface PhotoOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class PhotoLibrary {
  private readonly photos = new Map<string, Photo>();
  private readonly albums = new Map<string, Album>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: PhotoOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createAlbum(name: string): Album {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("an album needs a name");
    if ([...this.albums.values()].some((album) => album.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`album already exists: ${trimmed}`);
    }
    const album: Album = { id: newId("alb"), name: trimmed, createdAt: nowIso(this.clock) };
    this.albums.set(album.id, album);
    this.ledger.append({ type: "photos.album.created", actor: "photos", subject: album.id, data: { name: trimmed } });
    return { ...album };
  }

  listAlbums(): Album[] {
    return [...this.albums.values()].sort((a, b) => a.name.localeCompare(b.name)).map((album) => ({ ...album }));
  }

  add(input: AddPhotoInput): Photo {
    if (!input.filename.trim()) throw new Error("a photo needs a filename");
    if (!input.mime.startsWith("image/")) throw new Error(`not an image mime type: ${input.mime}`);
    if (!Number.isInteger(input.bytes) || input.bytes <= 0) throw new Error(`photo size is invalid: ${input.bytes}`);
    if (!Number.isInteger(input.width) || input.width <= 0) throw new Error(`photo width is invalid: ${input.width}`);
    if (!Number.isInteger(input.height) || input.height <= 0) throw new Error(`photo height is invalid: ${input.height}`);
    if (!Number.isFinite(Date.parse(input.takenAt))) throw new Error(`takenAt is not a date: ${input.takenAt}`);
    if (!/^[a-f0-9]{64}$/.test(input.contentHash)) throw new Error("contentHash must be a SHA-256 hex digest");
    if (input.albumId && !this.albums.has(input.albumId)) throw new Error(`no album: ${input.albumId}`);
    const photo: Photo = {
      id: newId("pho"),
      filename: input.filename.trim(),
      mime: input.mime,
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      takenAt: new Date(input.takenAt).toISOString(),
      albumId: input.albumId ?? null,
      tags: [...new Set((input.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort(),
      favorite: input.favorite === true,
      caption: input.caption?.trim() ?? "",
      contentHash: input.contentHash,
      addedAt: nowIso(this.clock),
    };
    this.photos.set(photo.id, photo);
    this.ledger.append({ type: "photos.added", actor: "photos", subject: photo.id, data: { bytes: photo.bytes } });
    return structuredClone(photo);
  }

  get(photoId: string): Photo | undefined {
    const photo = this.photos.get(photoId);
    return photo ? structuredClone(photo) : undefined;
  }

  list(filter: { albumId?: string; tag?: string; favorite?: boolean } = {}): Photo[] {
    const tag = filter.tag?.trim().toLowerCase();
    return [...this.photos.values()]
      .filter((photo) => filter.albumId === undefined || photo.albumId === filter.albumId)
      .filter((photo) => tag === undefined || photo.tags.includes(tag))
      .filter((photo) => filter.favorite === undefined || photo.favorite === filter.favorite)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt) || a.filename.localeCompare(b.filename))
      .map((photo) => structuredClone(photo));
  }

  search(query: string, limit = 50): Photo[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error(`limit is out of range: ${limit}`);
    return [...this.photos.values()]
      .filter((photo) => {
        const haystack = `${photo.filename}\n${photo.caption}\n${photo.tags.join(" ")}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
      .slice(0, limit)
      .map((photo) => structuredClone(photo));
  }

  setFavorite(photoId: string, favorite: boolean): Photo {
    const photo = this.require(photoId);
    photo.favorite = favorite;
    this.photos.set(photoId, photo);
    return structuredClone(photo);
  }

  /** Groups of photos that share a caller-supplied content hash. */
  duplicates(): Photo[][] {
    const byHash = new Map<string, Photo[]>();
    for (const photo of this.photos.values()) {
      const group = byHash.get(photo.contentHash) ?? [];
      group.push(photo);
      byHash.set(photo.contentHash, group);
    }
    return [...byHash.values()]
      .filter((group) => group.length > 1)
      .map((group) => group.sort((a, b) => a.filename.localeCompare(b.filename)).map((photo) => structuredClone(photo)))
      .sort((a, b) => a[0]!.filename.localeCompare(b[0]!.filename));
  }

  remove(photoId: string): boolean {
    this.require(photoId);
    this.photos.delete(photoId);
    this.ledger.append({ type: "photos.removed", actor: "photos", subject: photoId, data: {} });
    return true;
  }

  private require(photoId: string): Photo {
    const photo = this.photos.get(photoId);
    if (!photo) throw new Error(`no photo: ${photoId}`);
    return structuredClone(photo);
  }
}

/** The host hashes the bytes; this helper exists for adapters that hold them. */
export function contentHashOf(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
