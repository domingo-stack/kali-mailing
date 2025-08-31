import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar"; // Debe estar importado

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestor de Tareas",
  description: "Creado con Gemini y Domingo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar /> {/* Debe estar aquí */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}