"use client"

import { useEffect, useState, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/api-client"

interface Banner {
  id: number
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  displayOrder: number
  isActive: boolean
  backgroundColor: string
  textColor: string
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  )

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/banners`)
        const data = await response.json()
        setBanners(data)
      } catch (error) {
        console.error("Failed to fetch banners:", error)
      }
    }

    fetchBanners()
  }, [])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  if (banners.length === 0) {
    return null
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="relative min-w-0 flex-[0_0_100%]"
            >
              {banner.linkUrl ? (
                <a
                  href={banner.linkUrl}
                  className="block h-[280px] md:h-[360px]"
                >
                  <img
                    src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `${API_BASE_URL}${banner.imageUrl}`}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <div className="h-[280px] md:h-[360px]">
                  <img
                    src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `${API_BASE_URL}${banner.imageUrl}`}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 hover:bg-white/90 text-gray-900"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 hover:bg-white/90 text-gray-900"
            onClick={scrollNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              onClick={() => scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
