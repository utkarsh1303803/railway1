import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "RailRakshak | RPF Command Center",
    description: "Advanced Railway SOS & Evidence Management Dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
                <div className="flex">
                    <Sidebar />
                    <div className="flex-1 flex flex-col min-h-screen">
                        <Header />
                        <main className="flex-1 ml-64 p-8">
                            {children}
                        </main>
                    </div>
                </div>
            </body>
        </html>
    );
}
