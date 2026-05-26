/**
 * モバイル向けレイアウト（md未満）。md以上は従来のゆとりあるWeb版を維持。
 */
export const m = {
  sectionPy: "py-10 md:py-24",
  sectionPyMid: "py-8 md:py-16",
  sectionPyPricing: "py-12 md:py-20",
  sectionHead: "text-center mb-7 md:mb-12",
  sectionHeadLg: "text-center mb-8 md:mb-16",
  sectionLabel: "text-brand text-xs md:text-sm font-bold tracking-widest uppercase mb-1.5 md:mb-2",
  sectionTitle: "text-xl md:text-3xl font-bold text-warm mb-2 md:mb-4",
  sectionLead: "text-warm-muted text-xs md:text-base max-w-md mx-auto leading-normal md:leading-relaxed",
  body: "text-warm-muted text-xs md:text-sm leading-normal md:leading-relaxed",
  gapLg: "gap-5 md:gap-8",
  gapMd: "gap-4 md:gap-6",
  cardPad: "p-4 md:p-6",
  cardPadLg: "p-5 md:p-8",
  stackSm: "space-y-2 md:space-y-3",
  stackMd: "space-y-4 md:space-y-6",
} as const;
