"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Loader2,
  Package2,
  X,
  CircleSlashed,
  Library,
  LayoutList,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatRupiah } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductStore } from "@/store/useProductStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { usePathname } from "next/navigation";
import { getProductPriceDisplay } from "@/utils/product";
import { useProducts } from "@/hooks/useProducts"; // Import the SWR hook
import { deleteProductAction } from "@/app/actions/product-actions"; // Import server action

function AdminProductList() {
  const pathname = usePathname();
  const { toast } = useToast();

  // Use ProductStore only for UI filters state management
  const { filters, setFilters } = useProductStore();

  // Use SWR hook for data fetching instead of the store
  const {
    data: products,
    pagination,
    isLoading,
    isValidating,
    error,
    mutate, // We'll use this to refresh data after operations
  } = useProducts({
    page: filters.page || 1,
    limit: filters.limit || 10,
    categorySlug: filters.categorySlug,
    collectionId: filters.collectionId,
    sortBy: filters.sortBy,
    searchQuery: filters.searchQuery,
    includePriceVariants: true,
  });

  // Fetch categories and collections using their respective stores
  const { categories, fetchCategories } = useCategoryStore();
  const { collections, fetchCollections } = useCollectionStore();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    slug: string | null;
  }>({
    open: false,
    slug: null,
  });

  // Initial data fetch for categories and collections
  useEffect(() => {
    fetchCategories();
    fetchCollections();
  }, [fetchCategories, fetchCollections]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.page)
      return;
    setFilters({ page, includePriceVariants: true });
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    // If search is cleared, reset search filter
    if (newValue === "" && filters.searchQuery) {
      handleResetSearch();
    }
  };

  // Handle search button click
  const handleSearch = () => {
    // If search is empty but there's a previous search filter, reset
    if (searchQuery === "" && filters.searchQuery) {
      handleResetSearch();
      return;
    }

    // If search is empty and there's no previous search filter, do nothing
    if (searchQuery === "" && !filters.searchQuery) {
      return;
    }

    // Reset to page 1 when searching
    setFilters({ searchQuery, page: 1, includePriceVariants: true });
  };

  // Reset search filter
  const handleResetSearch = () => {
    setSearchQuery("");

    // Keep other filters, just remove the search query
    const { searchQuery: _, ...otherFilters } = filters;
    setFilters({
      ...otherFilters,
      searchQuery: "",
      page: 1,
    });
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setFilters({ categorySlug: value === "all" ? undefined : value, page: 1 });
  };

  // Handle collection filter change
  const handleCollectionChange = (value: string) => {
    setFilters({ collectionId: value === "all" ? undefined : value, page: 1 });
  };

  // Handle product deletion (open confirmation dialog)
  const handleDelete = (slug: string) => {
    setDeleteConfirmDialog({
      open: true,
      slug,
    });
  };

  // Execute actual deletion after confirmation using server action
  const confirmDelete = async () => {
    const slugToDelete = deleteConfirmDialog.slug;
    if (!slugToDelete) return;

    setDeleteConfirmDialog({ open: false, slug: null });
    setDeletingSlug(slugToDelete);

    try {
      // Use the server action to delete the product
      const result = await deleteProductAction(slugToDelete);

      if (result.success) {
        // Refresh the data after successful deletion
        mutate();

        toast({
          title: "Produk berhasil dihapus",
          description: "Produk telah dihapus dari sistem.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Gagal menghapus produk",
          description:
            result.message || "Terjadi kesalahan saat menghapus produk.",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        variant: "destructive",
        title: "Gagal menghapus produk",
        description:
          "Terjadi kesalahan saat menghapus produk. Silakan coba lagi.",
      });
    } finally {
      setDeletingSlug(null);
    }
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const { page, totalPages } = pagination;

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink
          isActive={page === 1}
          onClick={() => handlePageChange(1)}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Add ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show current page and neighbors
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      if (i <= 1 || i >= totalPages) continue; // Skip first and last page

      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={page === i}
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            isActive={page === totalPages}
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Render product skeletons when loading
  const renderProductSkeletons = () => {
    return Array(pagination.limit || 5)
      .fill(null)
      .map((_, index) => (
        <TableRow key={`skeleton-${index}`} className="animate-pulse">
          <TableCell className="w-[80px]">
            <Skeleton className="h-12 w-12 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-full max-w-[250px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ));
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading && products?.length === 0) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (filters.searchQuery) {
      // Display "not found" message for empty search results
      return (
        <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
          <CircleSlashed className="h-8 w-8" />
          <p>
            Tidak ada produk yang sesuai dengan pencarian "{filters.searchQuery}
            "
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSearch}
            className="mt-2"
          >
            Hapus Pencarian
          </Button>
        </div>
      );
    }

    // Display "no products" message when there are no products yet
    return (
      <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
        <Package2 className="h-8 w-8" />
        <p>Belum ada produk</p>
        <Link href="/dashboard/admin/product/add">
          <Button size="sm" className="mt-2">
            <PlusCircle className="h-4 w-4 mr-2" /> Tambah Produk
          </Button>
        </Link>
      </div>
    );
  };

  // Handle error from SWR
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2">Daftar Produk</h1>
          <Link href="/dashboard/admin/product/add">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
          </Link>
        </div>

        <Card className="p-8 flex flex-col items-center">
          <CircleSlashed className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Terjadi Kesalahan</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {error.message || "Gagal memuat data produk"}
          </p>
          <Button
            variant="outline"
            onClick={() => mutate()} // Retry by re-validating SWR
          >
            Coba Lagi
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Daftar Produk</h1>
          <p className="text-muted-foreground">
            Kelola produk yang dijual di toko Anda
          </p>
        </div>
        <Link href="/dashboard/admin/product/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Search and filters section - More minimalist UI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          {/* Search with minimalist styling - Simplified buttons */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari produk..."
              className="pl-9 pr-10 h-9"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />

            {/* Single clear button when there's input */}
            {(searchQuery || filters.searchQuery) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetSearch}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <Select
              value={filters.categorySlug || "all"}
              onValueChange={handleCategoryChange}
              disabled={isLoading}
            >
              <SelectTrigger id="category-filter" className="h-9 w-[180px]">
                <div className="flex items-center">
                  <LayoutList className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Kategori" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Tidak ada kategori
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select
              value={filters.collectionId || "all"}
              onValueChange={handleCollectionChange}
              disabled={isLoading}
            >
              <SelectTrigger id="collection-filter" className="h-9 w-[180px]">
                <div className="flex items-center">
                  <Library className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Koleksi" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Koleksi</SelectItem>
                {collections.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Tidak ada koleksi
                  </SelectItem>
                ) : (
                  collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters as badges */}
        {(filters.categorySlug ||
          filters.collectionId ||
          filters.searchQuery) && (
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            {filters.categorySlug && (
              <Badge variant="outline" className="flex gap-1 items-center py-1">
                <LayoutList className="h-3 w-3 mr-1" />
                {categories.find((c) => c.slug === filters.categorySlug)
                  ?.name || "Loading..."}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 -mr-1 rounded-full"
                  onClick={() => handleCategoryChange("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filters.collectionId && (
              <Badge variant="outline" className="flex gap-1 items-center py-1">
                <Library className="h-3 w-3 mr-1" />
                {collections.find((c) => c.id === filters.collectionId)?.name ||
                  "Loading..."}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 -mr-1 rounded-full"
                  onClick={() => handleCollectionChange("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filters.searchQuery && (
              <Badge variant="outline" className="flex gap-1 items-center py-1">
                <Search className="h-3 w-3 mr-1" />
                {filters.searchQuery}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 -mr-1 rounded-full"
                  onClick={handleResetSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <span className="flex items-center ml-auto text-muted-foreground">
                <Loader2 className="animate-spin h-3 w-3 mr-1" />
                Memuat...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products Table with Improved Loading States */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 relative">
        {/* Loading overlay for data refresh */}
        {(isValidating || isLoading) && products?.length > 0 && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">
                Memperbarui data...
              </span>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Gambar</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !products?.length ? (
              renderProductSkeletons()
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.featuredImage?.url ? (
                      <div className="relative h-12 w-12 rounded-md overflow-hidden">
                        <Image
                          src={product.featuredImage.url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      {product.specialLabel && (
                        <Badge variant="outline" className="w-fit mt-1 text-xs">
                          {product.specialLabel === "new" && "Baru"}
                          {product.specialLabel === "best" && "Best Seller"}
                          {product.specialLabel === "sale" && "Diskon"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getProductPriceDisplay(product)}</TableCell>
                  <TableCell>
                    {product.hasVariations ? (
                      <Badge variant="secondary">Multiple</Badge>
                    ) : product.baseStock !== null ? (
                      product.baseStock
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{product.category?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* View product button */}
                      <Link
                        href={`/produk/${product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Lihat di Situs"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* Existing edit button */}
                      <Link
                        href={`/dashboard/admin/product/edit/${product.slug}`}
                      >
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* Existing delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        title="Hapus"
                        disabled={deletingSlug === product.slug}
                        onClick={() => handleDelete(product.slug)}
                      >
                        {deletingSlug === product.slug ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="py-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      const isDisabled =
                        pagination.page === 1 || isLoading || isValidating;
                      if (!isDisabled) {
                        handlePageChange(pagination.page - 1);
                      }
                    }}
                    className={`cursor-pointer ${
                      isLoading || isValidating || pagination.page === 1
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    aria-disabled={
                      pagination.page === 1 || isLoading || isValidating
                    }
                  />
                </PaginationItem>
                {/* If loading, slightly dim the pagination items */}
                <div
                  className={`flex items-center ${
                    isLoading || isValidating ? "opacity-70" : ""
                  }`}
                >
                  {renderPaginationItems()}
                </div>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      const isDisabled =
                        pagination.page === pagination.totalPages ||
                        isLoading ||
                        isValidating;
                      if (!isDisabled) {
                        handlePageChange(pagination.page + 1);
                      }
                    }}
                    className={`cursor-pointer ${
                      isLoading ||
                      isValidating ||
                      pagination.page === pagination.totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    aria-disabled={
                      pagination.page === pagination.totalPages ||
                      isLoading ||
                      isValidating
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmDialog.open}
        onOpenChange={(open) =>
          setDeleteConfirmDialog({ ...deleteConfirmDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Hapus Produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminProductList;
