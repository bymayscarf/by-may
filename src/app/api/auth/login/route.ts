import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createToken } from "@/lib/auth/auth";
import { db } from "@/lib/db";

/**
 * POST /api/auth/login
 *
 * Mengautentikasi pengguna dengan email dan password.
 * Menyimpan cookie HTTP-only dengan token JWT jika autentikasi berhasil.
 *
 * @param {NextRequest} req - Objek permintaan masuk yang berisi email dan password
 * @returns {Promise<NextResponse>} Respons JSON dengan data pengguna atau error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password diperlukan" },
        { status: 400 }
      );
    }

    // Find the user
    try {
      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: "Email atau password tidak valid" },
          { status: 401 }
        );
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        return NextResponse.json(
          { error: "Email atau password tidak valid" },
          { status: 401 }
        );
      }

      // Create session data
      const userSession = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      };

      // Create JWT token
      const token = createToken(userSession);

      // Create the response
      const response = NextResponse.json({
        success: true,
        user: userSession,
      });

      // Set HTTP-only cookie with the token
      // Max age: 7 days in seconds
      response.cookies.set({
        name: "authToken",
        value: token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    } catch (dbError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
