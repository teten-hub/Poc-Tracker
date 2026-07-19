# Poc-Tracker

## API Integration (Singkat)

Endpoint integrasi yang disediakan:

- `GET /api/ip-report?ip=<IP>` — mengembalikan hasil analisa dalam format JSON untuk diintegrasikan ke platform lain.

Contoh panggilan (lokal, pastikan Next.js berjalan):

```bash
curl 'http://localhost:3000/api/ip-report?ip=8.8.8.8'
```

Respons singkat (struktur umum):

```json
{
	"success": true,
	"ip": "8.8.8.8",
	"vt": { /* VirusTotal summary */ },
	"otx": { /* AlienVault OTX summary */ },
	"abuseipdb": { /* AbuseIPDB summary + reports */ },
	"location": { "country": "United States", "city": "Mountain View", "isp": "Google LLC" }
}
```

Catatan:

- API menggunakan kunci dari environment: `VIRUSTOTAL_API_KEY`, `OTX_API_KEY`, `ABUSEIPDB_API_KEY`. Jika tidak diset, respons akan tetap dikembalikan tetapi bagian terkait akan menandakan `configured: false`.
- AbuseIPDB dan layanan lain menerapkan rate limits — hati-hati saat mengotomasi banyak permintaan.
- Untuk integrasi produksi, disarankan menambahkan autentikasi (API key atau bearer token), dan/atau header CORS terbatas.

Jika mau, saya bisa tambahkan dokumentasi lebih lengkap (contoh respons penuh, mapping kategori AbuseIPDB, dan contoh client integration). 
