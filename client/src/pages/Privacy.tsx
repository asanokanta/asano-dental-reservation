import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-5 py-10">
        <a href="/" className="inline-flex items-center gap-1.5 text-brand font-bold mb-8 hover:text-brand-dark">
          <ArrowLeft className="w-4 h-4" />
          トップページへ戻る
        </a>

        <h1 className="text-2xl font-bold text-warm mb-2" style={{ fontFamily: "'Noto Serif JP', serif" }}>
          プライバシーポリシー
        </h1>
        <p className="text-sm text-warm-muted mb-8">個人情報保護方針</p>

        <div className="space-y-8 text-sm text-warm leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">1. 事業者情報</h2>
            <p>医院名：あさの歯科<br />
            所在地：東京都北区王子5-5-3 シーメゾン王子神谷101<br />
            電話番号：03-3913-4618<br />
            院長：あさの えいじ</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">2. 収集する個人情報</h2>
            <p>当院のネット予約システム・公式LINEを通じて、以下の情報を収集します。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-warm-muted">
              <li>お名前（漢字）</li>
              <li>診察券番号</li>
              <li>ご予約日時</li>
              <li>LINE ユーザーID（公式LINE利用時）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">3. 利用目的</h2>
            <p>収集した個人情報は、以下の目的のみに使用します。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-warm-muted">
              <li>ネット予約の受付・管理</li>
              <li>予約前日のリマインド通知（LINE）</li>
              <li>休診日・診療変更などのお知らせ（LINE）</li>
              <li>診療記録との照合（本人確認）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">4. 第三者提供について</h2>
            <p>当院は、以下の場合を除き、収集した個人情報を第三者に提供しません。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-warm-muted">
              <li>法令に基づく場合</li>
              <li>ご本人の同意がある場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">5. 業務委託先（クラウドサービス）</h2>
            <p>当院は、以下のクラウドサービスを利用して情報を管理します。各サービスのプライバシーポリシーに従い、適切に保護されます。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-warm-muted">
              <li>Supabase（データベース・米国）</li>
              <li>Cloudflare（Webサーバー・米国）</li>
              <li>LINE株式会社（メッセージング・日本）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">6. 保存期間</h2>
            <p>予約情報は予約日以降も診療記録管理のため保存します。退会・削除をご希望の場合は下記までご連絡ください。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">7. 個人情報の開示・訂正・削除</h2>
            <p>ご本人からの個人情報の開示・訂正・削除のご要望には、本人確認の上、速やかに対応いたします。下記の連絡先までお申し出ください。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">8. Cookieについて</h2>
            <p>当院のウェブサイトでは、Cookieを使用していません。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">9. お問い合わせ</h2>
            <p>個人情報の取り扱いに関するお問い合わせは、下記までご連絡ください。</p>
            <div className="mt-2 p-4 bg-accent-light rounded-xl border border-brand/20">
              <p className="font-bold">あさの歯科</p>
              <p>〒114-0002 東京都北区王子5-5-3 シーメゾン王子神谷101</p>
              <p>TEL：<a href="tel:0339134618" className="text-brand font-bold">03-3913-4618</a></p>
              <p>受付時間：診療時間内</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-warm mb-3 border-l-4 border-brand pl-3">10. 改定について</h2>
            <p>本ポリシーは、法令の改正や運営状況の変化に応じて改定することがあります。改定後はこのページに掲載します。</p>
          </section>

          <p className="text-warm-muted text-xs pt-4 border-t border-cream-muted">
            制定日：2026年6月<br />
            あさの歯科
          </p>
        </div>
      </div>
    </div>
  );
}
