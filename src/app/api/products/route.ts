import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product-service";
import { verifyToken } from "@/lib/auth/auth";

/**
 * GET handler for product API endpoint
 * @param req - The incoming request
 * @returns A paginated list of products with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const collectionId = searchParams.get("collectionId") || undefined;
    const specialLabel = searchParams.get("specialLabel") || undefined;
    const sortBy = searchParams.get("sortBy") || "newest";
    // Tambahkan parameter untuk mengambil priceVariants
    const includePriceVariants =
      searchParams.get("includePriceVariants") === "true";
    const options = {
      page,
      limit,
      search,
      categorySlug,
      collectionId,
      specialLabel,
      sortBy,
      includePriceVariants,
    };

    const products = await ProductService.getProducts(options);

    return NextResponse.json(products);
  } catch (error) {
    console.error("API - Error fetching products:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Membuat produk baru
 *
 * @param req - Request dari Next.js yang berisi data produk baru
 * @returns Response JSON dengan produk yang berhasil dibuat atau pesan kesalahan
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Autentikasi diperlukan" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Tidak diizinkan: Akses admin diperlukan" },
        { status: 403 }
      );
    }

    const data = await req.json();

    // Buat produk menggunakan layanan
    const product = await ProductService.createProduct(data);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat produk:", error);
    return NextResponse.json(
      {
        error: "Gagal membuat produk",
        details:
          error instanceof Error ? error.message : "Kesalahan tidak diketahui",
      },
      { status: 500 }
    );
  }
}
