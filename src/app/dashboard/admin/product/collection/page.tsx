"use client";

import CollectionForm from "@/components/admin/product/CollectionForm";
import CollectionList from "@/components/admin/product/CollectionList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Halaman pengelolaan koleksi produk
 */
function CollectionPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header dengan judul dan tombol tambah */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Koleksi Produk</h1>
          <p className="text-muted-foreground">
            Kelola koleksi untuk mengelompokkan produk berdasarkan tema atau
            musim
          </p>
        </div>
        <Button onClick={() => setIsAddSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Koleksi
        </Button>
      </div>

      {/* Daftar koleksi dengan styling yang sama seperti daftar produk */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <CollectionList />
      </div>

      {/* Form koleksi dalam sheet slide-out */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent className="w-full md:max-w-md">
          <SheetHeader>
            <SheetTitle>Tambah Koleksi</SheetTitle>
            <SheetDescription>
              Buat koleksi baru untuk mengelompokkan produk Anda
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <CollectionForm onSuccess={() => setIsAddSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default CollectionPage;
