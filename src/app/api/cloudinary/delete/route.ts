import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { verifyToken } from "@/lib/auth/auth";
import { CloudinaryService } from "@/lib/services/cloudinary-service";

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Ekstrak public_id dari URL Cloudinary
 * Menggunakan implementasi yang lebih lengkap dari CloudinaryService
 */
function extractPublicIdFromUrl(url: string): string | null {
  // Gunakan implementasi dari CloudinaryService yang lebih lengkap
  return CloudinaryService.extractPublicIdFromUrl(url);
}

export async function POST(request: NextRequest) {
  try {
    // Ambil data dari body request
    const body = await request.json().catch((e) => ({}));

    // Ekstrak data yang diperlukan - mendukung publicId langsung dan url
    const { url, publicId: directPublicId } = body;

    // Lacak apakah kita memiliki ID publik langsung atau ekstraksi dari URL
    let imageId: string | null = null;
    let fromUrl = false;

    // Tangani parameter yang diperlukan yang hilang
    if (!directPublicId && !url) {
      return NextResponse.json(
        { error: "URL gambar atau publicId diperlukan" },
        { status: 400 }
      );
    }

    // Jika publicId disediakan langsung, gunakan
    if (directPublicId) {
      imageId = directPublicId;
    }
    // Jika hanya URL yang disediakan, ekstrak publicId dari URL
    else if (url) {
      fromUrl = true;
      imageId = extractPublicIdFromUrl(url);
      if (!imageId) {
        return NextResponse.json(
          { error: "Tidak dapat mengekstrak publicId dari URL" },
          { status: 400 }
        );
      }
    }

    try {
      // Hapus dari Cloudinary
      const result = await cloudinary.uploader.destroy(imageId!);
      return NextResponse.json({
        success: true,
        result,
        publicId: imageId, // Tambahkan publicId ke respons untuk konfirmasi
      });
    } catch (cloudinaryError: any) {
      // Log error untuk debugging
      console.error(`[API] Cloudinary delete error:`, cloudinaryError);

      // Jika resource tidak ditemukan tapi kita menghapus, anggap sukses
      if (cloudinaryError.error?.message?.includes("not found")) {
        return NextResponse.json({
          success: true,
          result: { result: "not found" },
          publicId: imageId, // Tambahkan publicId ke respons untuk konfirmasi
          message:
            "Sumber daya tidak ditemukan di Cloudinary (sudah dihapus atau tidak pernah ada)",
        });
      }

      return NextResponse.json(
        {
          error: "Kesalahan API Cloudinary",
          details: cloudinaryError?.error?.message || String(cloudinaryError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Gagal memproses permintaan hapus",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
