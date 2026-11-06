import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { NavBar } from "@/components/NavBar";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: "500", variable: "--font-mono", display: "swap" });
export const metadata = { title: "ArakTrace Bali", description: "Telusuri asal-usul arak Bali dan konsultasi produksi aman." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="id" className={`${inter.variable} ${mono.variable}`}><body>
    <DemoBanner />
    <NavBar />
    {children}
    <footer className="footer">ArakTrace.bali · Tim ArakTrace, Universitas Atma Jaya Yogyakarta · AI Web Innovation Challenge, Bali DigiFest 2026. Skor risiko adalah triase awal dan bukan pengganti uji laboratorium; keamanan minuman, termasuk kadar metanol, hanya dapat dipastikan lewat uji lab resmi.</footer>
  </body></html>);
}
