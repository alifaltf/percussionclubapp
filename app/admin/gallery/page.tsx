import { Suspense } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { GalleryIcon, PlusIcon } from "@/components/ui/icons";
import AlbumStatsRow from "@/components/admin/gallery/AlbumStatsRow";
import AlbumsToolbar from "@/components/admin/gallery/AlbumsToolbar";
import AlbumsTable from "@/components/admin/gallery/AlbumsTable";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAdminAlbums, getGalleryStats } from "@/lib/supabase/gallery";
import type {
  GalleryAlbumStatus,
  GalleryAlbumWithMeta,
  GalleryArchiveState,
  GalleryFeaturedState,
  GallerySort,
  GalleryStats,
} from "@/types/gallery";

const PAGE_SIZE = 20;

interface AdminGalleryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminGalleryPage({ searchParams }: AdminGalleryPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = firstValue(params.q) ?? "";
  const status = (firstValue(params.status) ?? "all") as GalleryAlbumStatus | "all";
  const archiveState = (firstValue(params.archive) ?? "all") as GalleryArchiveState;
  const featuredState = (firstValue(params.featured) ?? "all") as GalleryFeaturedState;
  const sort = (firstValue(params.sort) ?? "newest") as GallerySort;
  const page = Math.max(1, Number(firstValue(params.page) ?? "1") || 1);

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    archiveState !== "all" ||
    featuredState !== "all";

  let stats: GalleryStats | null = null;
  let albums: GalleryAlbumWithMeta[] = [];
  let totalCount = 0;
  let loadError = false;

  try {
    const [statsResult, listResult] = await Promise.all([
      getGalleryStats(),
      getAdminAlbums({
        search,
        status,
        archiveState,
        featuredState,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    ]);
    stats = statsResult;
    albums = listResult.albums;
    totalCount = listResult.totalCount;
  } catch {
    loadError = true;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
              Admin
            </span>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              Gallery Management
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#666666]">
              Create albums, upload photos and control what&apos;s publicly visible.
            </p>
          </div>
          <Button href="/admin/gallery/new">
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Add Album
          </Button>
        </div>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<GalleryIcon className="h-5 w-5" />}
              title="Couldn't load albums"
              description="Something went wrong while fetching the gallery. Please try again."
              action={
                <Button href="/admin/gallery" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {stats && (
              <div className="mt-10">
                <AlbumStatsRow stats={stats} />
              </div>
            )}

            <div className="mt-8">
              <Suspense fallback={null}>
                <AlbumsToolbar />
              </Suspense>
            </div>

            <div className="mt-6">
              {albums.length === 0 ? (
                <EmptyState
                  icon={<GalleryIcon className="h-5 w-5" />}
                  title={hasActiveFilters ? "No albums found" : "No albums yet"}
                  description={
                    hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "Create your first album to get started."
                  }
                  action={
                    !hasActiveFilters ? (
                      <Button href="/admin/gallery/new" variant="outline">
                        Add Album
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <AlbumsTable albums={albums} />
                  <div className="mt-6">
                    <Suspense fallback={null}>
                      <Pagination page={page} totalPages={totalPages} />
                    </Suspense>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
