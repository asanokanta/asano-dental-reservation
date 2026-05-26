/**
 * AccessSection Component — あさの歯科
 * Design: Soft Minimalism × Japanese Breathing Space
 * - Google Maps embed
 * - Address and access info
 * - Mint green accent
 */
import { useEffect, useRef } from "react";
import { m } from "@/lib/mobileLayout";
import { MapPin, Train, Clock, Phone, ExternalLink } from "lucide-react";
import { MapView } from "@/components/Map";

export default function AccessSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const els = entry.target.querySelectorAll(".fade-in-up");
            els.forEach((el) => el.classList.add("visible"));
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMapReady = (map: google.maps.Map) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: "東京都北区王子5-5-3 シーメゾン王子神谷101" },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const position = results[0].geometry.location;
          map.setCenter(position);
          map.setZoom(17);

          const marker = new google.maps.Marker({
            position,
            map,
            title: "あさの歯科",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#66BB6A",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 3,
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-family:'Noto Sans JP',sans-serif;padding:4px 8px;">
              <strong style="color:#2D3748;font-size:14px;">あさの歯科</strong><br/>
              <span style="color:#718096;font-size:12px;">東京都北区王子5-5-3</span><br/>
              <span style="color:#718096;font-size:12px;">シーメゾン王子神谷101</span>
            </div>`,
          });
          infoWindow.open(map, marker);
        } else {
          // Fallback to approximate coordinates
          const fallback = { lat: 35.7637, lng: 139.7358 };
          map.setCenter(fallback);
          map.setZoom(16);
          new google.maps.Marker({
            position: fallback,
            map,
            title: "あさの歯科",
          });
        }
      }
    );
  };

  return (
    <section id="access" className={`${m.sectionPy} bg-cream`} ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className={`${m.sectionHead} fade-in-up`}>
          <p className={m.sectionLabel}>Access</p>
          <h2 className={m.sectionTitle} style={{ fontFamily: "'Noto Serif JP', serif" }}>
            アクセス
          </h2>
          <div className="w-12 h-1 bg-brand rounded-full mx-auto" />
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-5 ${m.gapLg}`}>
          {/* Map */}
          <div className="lg:col-span-3 fade-in-up stagger-1">
            <div className="rounded-2xl overflow-hidden shadow-sm border border-cream-muted h-56 md:h-96">
              <MapView
                className="w-full h-full"
                onMapReady={handleMapReady}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-warm-muted/80">
                ※ 地図は参考位置です。
              </p>
              <a
                href="https://maps.google.com/?q=東京都北区王子5-5-3+シーメゾン王子神谷101"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Googleマップで開く
              </a>
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4 fade-in-up stagger-2">
            {/* Address */}
            <div className="bg-accent-light rounded-2xl p-4 md:p-5 border border-brand/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-warm-muted font-medium mb-1">住所</p>
                  <p className="text-sm font-bold text-warm">東京都北区王子5-5-3</p>
                  <p className="text-sm text-warm">シーメゾン王子神谷101</p>
                  <p className="text-xs text-brand font-medium mt-2 flex items-center gap-1">
                    <span>🦁</span>
                    ライオンマークの黄色い看板が目印です
                  </p>
                </div>
              </div>
            </div>

            {/* Train */}
            <div className="bg-card rounded-2xl p-4 md:p-5 border border-cream-muted shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Train className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-warm-muted font-medium mb-1">最寄り駅</p>
                  <p className="text-sm font-bold text-warm">東京メトロ南北線</p>
                  <p className="text-sm text-warm">「王子神谷駅」2番出口</p>
                  <p className="text-sm font-bold text-brand mt-1">徒歩約2分</p>
                </div>
              </div>
            </div>

            {/* Hours summary */}
            <div className="bg-card rounded-2xl p-4 md:p-5 border border-cream-muted shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-brand" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-warm-muted font-medium mb-2">診療時間</p>
                  <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-warm-muted shrink-0">午前</span>
                      <span className="font-medium text-warm text-right">9：30～13：00</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-warm-muted shrink-0">午後</span>
                      <span className="font-medium text-warm text-right">14：30～19：30</span>
                    </div>
                  </div>
                  <p className={`text-[11px] md:text-xs text-warm-muted/80 mt-1.5 md:mt-2 ${m.body}`}>
                    最終受付：月～水・金は午前12：00／午後19：00まで。木は午前10：00～12：00／午後17：00まで。土は午前12：00まで。
                    <br />
                    水曜午前・土曜午後 休診。第2・第4・第5木曜、第1・第3土曜、日曜・祝日 休診。
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-brand rounded-2xl p-4 md:p-5">
              <div className="flex items-center gap-2.5 md:gap-3 mb-2 md:mb-3">
                <Phone className="w-5 h-5 text-white" />
                <p className="text-white font-bold text-sm md:text-base">お電話でのご予約</p>
              </div>
              <a
                href="tel:03-3913-4618"
                className="block text-center text-xl md:text-2xl font-bold text-white tracking-wide hover:opacity-90 transition-opacity"
              >
                03-3913-4618
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
