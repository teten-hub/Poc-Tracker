import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Mengambil data dari API asli dengan cache 5 menit (300 detik)
    const res = await fetch('https://poc-in-github.motikan2010.net/api/v1/', {
      next: { revalidate: 300 }
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data dari API upstream' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const pocs = data.pocs || data || [];

    // Mengembalikan data JSON yang sudah dirapikan
    return NextResponse.json({
      success: true,
      count: pocs.length,
      timestamp: new Date().toISOString(),
      data: pocs
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
