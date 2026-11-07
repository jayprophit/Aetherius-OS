export class PhotosService {
  getState() { return { albums: [], images: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  index(i: any): string { return i.id || "ph-" + Date.now(); }
}
export const photosService = new PhotosService();
