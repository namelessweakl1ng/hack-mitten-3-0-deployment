export type StaticGalleryItem = {
  image: string;
  title?: string;
  caption?: string;
  year?: number;
};

export const GALLERY: StaticGalleryItem[] = [
  { image: "/images/gallery/gallery_107ae5e9b38d.jpg", title: "Archive 01" },
  { image: "/images/gallery/gallery_281f8433ca16.jpg", title: "Archive 02" },
  { image: "/images/gallery/gallery_3810d0fc668a.jpg", title: "Archive 03" },
  { image: "/images/gallery/gallery_422ed1dfbc9a.jpg", title: "Archive 04" },
  { image: "/images/gallery/gallery_5aa13a42a978.jpg", title: "Archive 05" },
  { image: "/images/gallery/gallery_84b51ffab12f.jpg", title: "Archive 06" },
  { image: "/images/gallery/gallery_987aaa4de3f3.jpg", title: "Archive 07" },
  { image: "/images/gallery/gallery_a4fb0dba489f.jpg", title: "Archive 08" },
];

export function resolveGalleryItems(databaseItems?: Array<{ id?: string; title?: string | null; caption?: string | null; imageUrl?: string | null; image?: string | null; year?: string | number | null }> | null) {
  if (databaseItems && databaseItems.length > 0) {
    return databaseItems.map((item, index) => ({
      id: item.id ?? `gallery-${index}`,
      title: item.title ?? `Archive ${String(index + 1).padStart(2, "0")}`,
      caption: item.caption ?? null,
      imageUrl: item.imageUrl ?? item.image ?? "/images/gallery/gallery_107ae5e9b38d.jpg",
      year: item.year ? String(item.year) : "",
    }));
  }

  return GALLERY.map((item, index) => ({
    id: `static-gallery-${index}`,
    title: item.title ?? `Archive ${String(index + 1).padStart(2, "0")}`,
    caption: item.caption ?? null,
    imageUrl: item.image,
    year: item.year ? String(item.year) : "",
  }));
}
