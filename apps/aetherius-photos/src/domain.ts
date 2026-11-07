import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface PhotoAlbum {
  id: string;
  title: string;
  photoIds: string[];
}

export interface PhotoEntry {
  id: string;
  albumId: string;
  title: string;
  width: number;
  height: number;
  takenAt: string;
}

export interface PhotosOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class PhotosService {
  private readonly albums = new Map<string, PhotoAlbum>();
  private readonly photos = new Map<string, PhotoEntry>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: PhotosOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createAlbum(title: string): PhotoAlbum {
    const album: PhotoAlbum = { id: newId("album"), title, photoIds: [] };
    this.albums.set(album.id, album);
    this.ledger.append({ type: "photos.album.created", actor: "photos", subject: album.id });
    return album;
  }

  addPhoto(albumId: string, title: string, width: number, height: number): PhotoEntry {
    const album = this.albums.get(albumId);
    if (!album) throw new Error("album not found");
    const photo: PhotoEntry = {
      id: newId("photo"),
      albumId,
      title,
      width,
      height,
      takenAt: nowIso(this.clock),
    };
    this.photos.set(photo.id, photo);
    album.photoIds.push(photo.id);
    this.ledger.append({ type: "photos.added", actor: "photos", subject: photo.id });
    return photo;
  }

  getAlbum(id: string): PhotoAlbum | undefined {
    return this.albums.get(id);
  }
}
