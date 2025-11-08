"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchContent } from "./SearchContent"
import { Suspense } from "react"

export function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

