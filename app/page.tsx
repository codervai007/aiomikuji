import { OmikujiTube, Sparkle } from "@/components/Art";
import { LogoImage } from "@/components/Logo";
import TiltedCard, { TiltedCardLayer } from "@/components/TiltedCard";

const SCREENS = [
  { href: "/omikuji", img: "/media/idle-poster.jpg", c: "c1", n: "一", t: "おみくじ画面", d: "来場者がさわるタッチパネルの画面。全画面・横向きで使います。" },
  { href: "/monitor", img: "/media/intro-poster.jpg", c: "c2", n: "二", t: "裏側モニター", d: "ブース後方の大きな画面。おみくじ画面の動きがリアルタイムで映ります。" },
  { href: "/staff", img: "/media/home-bg-poster.jpg", c: "c3", n: "三", t: "スタッフ設定", d: "当たりの数・裏面のコツ・部署・アンケート集計（PINが必要）。" },
];

export default function Page() {
  return (
    <main className="band home">
      <video className="homebg" src="/media/home-bg.mp4" poster="/media/home-bg-poster.jpg" autoPlay muted loop playsInline aria-hidden="true" />
      <div className="wrap">
        <div className="herocard">
          <Sparkle className="sp1" color="#e9525c" />
          <Sparkle className="sp2" color="#86efac" />
          <div>
            <LogoImage height={200} className="homelogo" />
            <h1 className="sr-only">AIおみくじ ブース</h1>
            <p className="lead">同じパソコンで「おみくじ画面」と「裏側モニター」を別々のウィンドウで開くと、自動で連動します。</p>
          </div>
          <div className="heroart">
            <OmikujiTube />
          </div>
        </div>
        <div className="launch">
          {SCREENS.map((s) => (
            <TiltedCard
              key={s.href}
              imageSrc={s.img}
              altText={s.t}
              captionText={s.t}
              containerHeight="300px"
              containerWidth="100%"
              imageHeight="300px"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              glare={0.5}
              shadow={0.5}
              backContent={
                <div className="tcback">
                  <h3>
                    <span className="num">{s.n}</span>
                    {s.t}
                  </h3>
                  <p>{s.d}</p>
                  <a className="btn primary" href={s.href}>
                    開く →
                  </a>
                </div>
              }
            >
              <div className="tcshade" />
              <TiltedCardLayer depth={40}>
                <h3 className="tctitle">
                  <span className="num">{s.n}</span>
                  {s.t}
                </h3>
                <span className="tchint">タップで裏返す</span>
              </TiltedCardLayer>
            </TiltedCard>
          ))}
        </div>
      </div>
    </main>
  );
}
