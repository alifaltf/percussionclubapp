import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import AlbumCoverImage from "@/components/gallery/AlbumCoverImage";
import AlbumStatusBadge from "@/components/admin/gallery/AlbumStatusBadge";
import ArchiveStateBadge from "@/components/admin/instruments/ArchiveStateBadge";
import AlbumRowActions from "@/components/admin/gallery/AlbumRowActions";
import { formatAlbumDate } from "@/utils/format-gallery";
import type { GalleryAlbumWithMeta } from "@/types/gallery";

interface AlbumsTableProps {
  albums: GalleryAlbumWithMeta[];
}

export default function AlbumsTable({ albums }: AlbumsTableProps) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell className="w-16">Cover</TableHeadCell>
              <TableHeadCell>Album</TableHeadCell>
              <TableHeadCell>Photos</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Published</TableHeadCell>
              <TableHeadCell>Archive</TableHeadCell>
              <TableHeadCell className="text-right">Actions</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {albums.map((album) => (
              <TableRow key={album.id}>
                <TableCell>
                  <AlbumCoverImage
                    src={album.cover_image_url}
                    alt={album.title}
                    sizes="48px"
                    className="h-12 w-12 rounded-sm"
                  />
                </TableCell>
                <TableCell>
                  <p className="flex items-center gap-1.5 font-medium text-[#111111]">
                    {album.title}
                    {album.is_featured && <Badge variant="gold">Featured</Badge>}
                  </p>
                  <p className="text-xs text-[#666666]">{album.slug}</p>
                </TableCell>
                <TableCell className="text-[#666666]">{album.image_count}</TableCell>
                <TableCell>
                  <AlbumStatusBadge status={album.status} />
                </TableCell>
                <TableCell className="text-[#666666]">
                  {album.published_at ? formatAlbumDate(album.published_at) : "—"}
                </TableCell>
                <TableCell>
                  <ArchiveStateBadge isArchived={Boolean(album.archived_at)} />
                </TableCell>
                <TableCell>
                  <AlbumRowActions album={album} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / narrow-screen card layout */}
      <div className="space-y-3 lg:hidden">
        {albums.map((album) => (
          <div key={album.id} className="rounded-2xl border border-[#E8E8E8] bg-white p-4">
            <div className="flex gap-3">
              <AlbumCoverImage
                src={album.cover_image_url}
                alt={album.title}
                sizes="64px"
                className="h-16 w-16 shrink-0 rounded-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 truncate font-serif text-base font-semibold text-[#111111]">
                  {album.title}
                  {album.is_featured && <Badge variant="gold">Featured</Badge>}
                </p>
                <p className="text-xs text-[#666666]">
                  {album.image_count} photos ·{" "}
                  {album.published_at ? formatAlbumDate(album.published_at) : "Unpublished"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <AlbumStatusBadge status={album.status} />
                  <ArchiveStateBadge isArchived={Boolean(album.archived_at)} />
                </div>
              </div>
            </div>
            <div className="mt-3 border-t border-[#E8E8E8] pt-3">
              <AlbumRowActions album={album} className="items-start" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
