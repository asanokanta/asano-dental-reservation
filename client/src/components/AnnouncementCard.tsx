import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { Announcement } from "@/data/announcements";
import { categoryStyles } from "@/data/announcements";

type Props = {
  item: Announcement;
  defaultOpen?: boolean;
};

export default function AnnouncementCard({ item, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const cat = categoryStyles[item.category];

  return (
    <article className="bg-card rounded-xl md:rounded-2xl border border-cream-muted shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-3.5 py-3 md:px-5 md:py-4 flex items-start gap-3 hover:bg-cream-light/60 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5">
            <time className="text-[11px] md:text-xs text-warm-muted font-medium">{item.dateLabel}</time>
            <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
              {item.category}
            </span>
            {item.isNew && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                NEW
              </span>
            )}
          </div>
          <h3
            className="text-sm md:text-base font-bold text-warm leading-snug pr-2"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            {item.title}
          </h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-brand shrink-0 mt-0.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-3.5 pb-4 md:px-5 md:pb-5 border-t border-cream-muted/80 bg-cream-light/30">
          <div className="pt-3 md:pt-4 space-y-3 text-xs md:text-sm text-warm-muted leading-normal md:leading-relaxed">
            {item.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            {item.bullets && item.bullets.length > 0 && (
              <ul className="list-disc pl-4 space-y-1 marker:text-brand">
                {item.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}

            {item.subSections?.map((section) => (
              <div key={section.heading ?? section.bullets[0]}>
                {section.heading && (
                  <p className="font-bold text-warm text-xs md:text-sm mb-1.5">{section.heading}</p>
                )}
                <ul className="list-disc pl-4 space-y-1 marker:text-brand">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}

            {item.images && item.images.length > 0 && (
              <div
                className={`grid gap-3 pt-1 ${
                  item.images.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {item.images.map((img) => (
                  <figure
                    key={img.src}
                    className="rounded-lg overflow-hidden border border-cream-muted bg-white"
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-auto max-h-64 md:max-h-80 object-contain"
                      loading="lazy"
                    />
                    {img.caption && (
                      <figcaption className="text-[10px] md:text-xs text-center text-warm-muted py-1.5 px-2 bg-cream-light">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}

            {item.link && (
              <a
                href={item.link.href}
                className="inline-flex items-center gap-1.5 text-brand font-bold text-xs md:text-sm hover:text-brand-dark transition-colors"
              >
                {item.link.label}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {item.signature && (
              <p className="text-right text-warm text-xs md:text-sm font-medium pt-1 border-t border-cream-muted/60">
                {item.signature}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
