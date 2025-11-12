# Rakamin Recruitment Management System

Platform manajemen rekrutmen modern yang dibangun dengan Next.js dan Supabase. Sistem ini memungkinkan admin untuk mengelola lowongan pekerjaan dan kandidat untuk melamar pekerjaan dengan form aplikasi dinamis.

## 🚀 Fitur

### Untuk Admin (Rekruter)
- **Manajemen Lowongan**: Buat, edit, dan hapus lowongan pekerjaan
- **Konfigurasi Form Dinamis**: Atur field aplikasi (wajib/opsional) untuk setiap lowongan
- **Manajemen Kandidat**: Review, terima, atau tolak pelamar
- **Filter & Pencarian**: Cari kandidat berdasarkan nama, email, atau status
- **Dashboard**: Overview semua lowongan dan statistik aplikasi

### Untuk Pelamar (Candidate)
- **Pencarian Lowongan**: Jelajahi lowongan yang tersedia
- **Form Aplikasi Dinamis**: Form yang menyesuaikan dengan kebutuhan lowongan
- **Tracking Status**: Pantau status lamaran secara real-time
- **Profil Lengkap**: Upload resume, portfolio, dan foto profil

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Supabase (Database, Auth, Storage)
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **UI Components**: Radix UI + Lucide Icons
- **Styling**: TailwindCSS dengan design system

## 📋 Prerequisites

- Node.js 18+
- npm atau yarn
- Akun Supabase (gratis)

## 🚀 Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd recruitment-management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard)
2. Copy **Project URL** dan **anon key** dari Settings > API
3. Buat file `.env.local` dan tambahkan:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Database

1. Buka Supabase SQL Editor
2. Copy dan jalankan query dari file `supabase-schema.sql`
3. Verify semua tabel dan trigger terbuat dengan benar

### 5. Setup Authentication

1. Di Supabase Dashboard, buka Authentication > Settings
2. Enable email/password authentication
3. Configure redirect URLs:
   - Allowed URLs: `http://localhost:3000` (untuk development)
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 6. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin routes
│   │   └── jobs/          # Job management
│   ├── candidate/         # Candidate routes
│   │   └── jobs/          # Job browsing & application
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── globals.css        # Global styles
│   └── page.tsx           # Homepage
├── components/            # Reusable components
│   └── ui/               # UI components
├── lib/                  # Utilities & configurations
│   ├── supabase.ts       # Supabase client
│   ├── store.ts          # Zustand stores
│   └── utils.ts          # Helper functions
└── types/                # TypeScript types
```

## 🎯 Demo Credentials

### Admin Account
- **Email**: admin@recruitment.com
- **Password**: admin123

### Register sebagai Candidate
1. Kunjungi `/register`
2. Isi data lengkap
3. Login dengan kredensial yang dibuat

## 🔧 Development

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Schema

Tabel utama:
- `users`: Data pengguna (admin & candidate)
- `jobs`: Lowongan pekerjaan dengan konfigurasi field dinamis
- `applications`: Data lamaran pelamar

### Key Features Implementation

#### Dynamic Form Fields
```typescript
// Example: Required fields configuration
required_fields: {
  full_name: boolean;
  email: boolean;
  phone: boolean;
  // ... other fields
}
```

#### Role-based Access Control
```typescript
// Middleware untuk route protection
useEffect(() => {
  if (!user || user.role !== 'admin') {
    router.push('/login')
    return
  }
}, [user, router])
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push ke GitHub repository
2. Connect ke Vercel
3. Setup environment variables di Vercel dashboard
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## 📊 Features yang Sudah Diimplementasi

✅ **Authentication System**
- Login/Logout
- Role-based access (admin/candidate)
- Session management

✅ **Admin Features**
- CRUD Lowongan Pekerjaan
- Konfigurasi field aplikasi dinamis
- Manajemen kandidat (review, accept, reject)
- Filter & search

✅ **Candidate Features**
- Browse lowongan aktif
- Form aplikasi dinamis
- Status tracking
- Profile management

✅ **UI/UX**
- Responsive design
- Modern UI dengan TailwindCSS
- Smooth transitions & animations
- Loading states

## 🔄 Future Enhancements

- [ ] File upload untuk resume/portfolio
- [ ] Email notifications
- [ ] Advanced filtering
- [ ] Export data ke CSV
- [ ] Analytics dashboard
- [ ] WebRTC untuk video interview
- [ ] Automated resume parsing

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Error**
   - Pastikan environment variables benar
   - Check Supabase auth settings

2. **Database Connection Error**
   - Verify Supabase project URL & anon key
   - Check RLS policies

3. **Build Error**
   - Pastikan semua dependencies terinstall
   - Check TypeScript errors

### Debug Mode

Untuk debugging, tambahkan di browser:
```javascript
localStorage.setItem('debug', 'supabase:*')
```

## 📝 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request

## 📞 Support

Untuk pertanyaan atau support, hubungi:
- Email: support@rakamin.com
- Documentation: [Wiki](https://github.com/rakamin/recruitment-system/wiki)

---

© 2024 Rakamin Recruitment Management System