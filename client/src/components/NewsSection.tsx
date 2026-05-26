/**
 * NewsSection — お知らせ一覧
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { m } from "@/lib/mobileLayout";
import {
  ANNOUNCEMENT_CATEGORIES,
  announcements,
  type AnnouncementCategory,
} from "@/data/announcements";
import AnnouncementCard from "@/components/AnnouncementCard";

export default function NewsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<AnnouncementCategory | "すべて">("お知らせ");

  const filtered = useMemo(() => {
    if (filter === "すべて") return announcements;
    return announcements.filter((a) => a.category === filter);
  }, [filter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".fade-in-up").forEach((el) => el.classList.add("visible"));
          }
        });
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="news" className={`${m.sectionPyMid} bg-cream-light`} ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className={`${m.sectionHead} fade-in-up text-left md:text-center`}>
          <div className="flex items-center gap-2.5 md:justify-center md:gap-3 mb-2">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-brand/15 flex items-center justify-center">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-brand" />
            </div>
            <p className={m.sectionLabel}>News</p>
          </div>
          <h2
            className={`${m.sectionTitle} text-left md:text-center`}
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            お知らせ
          </h2>
          <p className={`${m.sectionLead} text-left md:text-center md:mx-auto`}>
            診療・休診・設備導入など、当院からの最新のご案内です。タップして詳細をご覧ください。
          </p>
          <div className="w-12 h-1 bg-brand rounded-full md:mx-auto mt-3" />
        </div>

        {/* カテゴリーフィルター */}
        <div className="fade-in-up mb-4 md:mb-6 -mx-1 px-1 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 md:flex-wrap md:justify-center min-w-max md:min-w-0 pb-1">
            <FilterChip
              active={filter === "すべて"}
              onClick={() => setFilter("すべて")}
              label="すべて"
            />
            {ANNOUNCEMENT_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat}
                active={filter === cat}
                onClick={() => setFilter(cat)}
                label={cat}
              />
            ))}
          </div>
        </div>

        <div className={`${m.stackSm} md:space-y-3`}>
          {filtered.map((item, i) => (
            <div key={item.id} className={`fade-in-up stagger-${(i % 4) + 1}`}>
              <AnnouncementCard item={item} defaultOpen={item.isNew === true} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-warm-muted py-8">該当するお知らせはありません。</p>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-bold transition-colors ${
        active
          ? "bg-brand text-white shadow-sm"
          : "bg-card text-warm-muted border border-cream-muted hover:border-brand/40"
      }`}
    >
      {label}
    </button>
  );
}
