// npm install lucide-react recharts firebase
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  X,
  Home,
  ChevronRight,
  RefreshCw,
  BarChart2,
  BookOpen,
  User,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// ===================================================================
// Firebase設定（APIキー等は環境変数から読み込み。直書きは絶対に厳禁）
// ===================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// データ分離用のアプリ識別子（他問題集と混ざらないよう。後から一括書き換え可）
const APP_ID = "QuizApp_4_6_Info_System_Dev_001";
const SOURCE_LABEL = "スマート問題集 4-6 情報システムの開発";
const APP_TITLE = "4-6 情報システムの開発";
const SECTION_BADGE = "スマート問題集 4-6";

// Firebase初期化（多重初期化・設定欠如でもクラッシュしないよう防衛的に）
let app = null;
let auth = null;
let db = null;
try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn("[Firebase] 設定が未定義のため、LocalStorageフォールバックで動作します。");
  }
} catch (e) {
  console.warn("[Firebase] 初期化に失敗しました。LocalStorageフォールバックで動作します。", e);
}

const CHOICE_LABELS = ["ア", "イ", "ウ", "エ", "オ"];

// ===================================================================
// インラインSVG / テーブル図表コンポーネント群（外部画像URLは一切使用しない）
// 解説中の図は、すべて<svg>プリミティブで100%内製化し、与条件のラベル・数値を
// 1つも省略せずにマッピングする。
// ===================================================================

// 共通：白背景カードに図/SVGを描画（ダークテーマ上で見やすく）
const FigCard = ({ children, caption }) => (
  <div className="my-4">
    <div className="rounded-xl bg-white p-3 shadow-lg overflow-x-auto">{children}</div>
    {caption && <p className="mt-1 text-center text-xs text-slate-400">{caption}</p>}
  </div>
);

// SVG用：複数行テキストを描画するヘルパー
const MultiText = ({ x, y, lines, lineH = 15, fontSize = 12, fill = "#1e293b", fontWeight = "normal", anchor = "middle" }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={fontSize} fill={fill} fontWeight={fontWeight}>
    {lines.map((ln, i) => (
      <tspan key={i} x={x} dy={i === 0 ? 0 : lineH}>
        {ln}
      </tspan>
    ))}
  </text>
);

// 共通の矢印マーカー定義
const ArrowDefs = ({ id = "arw", color = "#334155" }) => (
  <defs>
    <marker id={id} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L8,3 L0,6 Z" fill={color} />
    </marker>
  </defs>
);

// --- 問10：DFD（データフローダイアグラム） ---
// 問題画面ではニュートラルな与条件図（showExplanation=false）。
// 解説画面（showExplanation=true）になって初めて「プロセス」「データストア」の注釈を描画する。
const DfdFigure = ({ showExplanation = false }) => (
  <FigCard caption={showExplanation ? "図：DFD（プロセスとデータストアの注釈つき）" : "図：情報システムの設計に用いられる図"}>
    <svg viewBox="0 0 600 240" className="w-full" style={{ maxHeight: 260 }}>
      <ArrowDefs id="dfdArw" color="#334155" />
      {/* 担当者（外部実体） */}
      <rect x="30" y="80" width="110" height="56" fill="#ffffff" stroke="#475569" strokeWidth="2" />
      <text x="85" y="114" textAnchor="middle" fontSize="16" fill="#1e293b" fontWeight="bold">担当者</text>
      {/* 担当者 → 注文 */}
      <line x1="140" y1="108" x2="214" y2="108" stroke="#334155" strokeWidth="2" markerEnd="url(#dfdArw)" />
      {/* 注文（プロセス） */}
      <ellipse cx="290" cy="108" rx="74" ry="40" fill="#bbf7d0" stroke="#15803d" strokeWidth="1.5" />
      <text x="290" y="114" textAnchor="middle" fontSize="16" fill="#14532d" fontWeight="bold">注文</text>
      {/* 注文 → 在庫確認 */}
      <line x1="364" y1="108" x2="414" y2="108" stroke="#334155" strokeWidth="2" markerEnd="url(#dfdArw)" />
      {/* 在庫確認（プロセス） */}
      <ellipse cx="490" cy="108" rx="74" ry="40" fill="#bbf7d0" stroke="#15803d" strokeWidth="1.5" />
      <text x="490" y="114" textAnchor="middle" fontSize="16" fill="#14532d" fontWeight="bold">在庫確認</text>
      {/* 商品ファイル（データストア） */}
      <line x1="290" y1="148" x2="290" y2="178" stroke="#334155" strokeWidth="2" markerStart="url(#dfdArw)" markerEnd="url(#dfdArw)" />
      <line x1="215" y1="182" x2="365" y2="182" stroke="#334155" strokeWidth="2" />
      <text x="290" y="204" textAnchor="middle" fontSize="15" fill="#1e293b" fontWeight="bold">商品ファイル</text>
      {/* 在庫ファイル（データストア） */}
      <line x1="490" y1="148" x2="490" y2="178" stroke="#334155" strokeWidth="2" markerStart="url(#dfdArw)" markerEnd="url(#dfdArw)" />
      <line x1="415" y1="182" x2="565" y2="182" stroke="#334155" strokeWidth="2" />
      <text x="490" y="204" textAnchor="middle" fontSize="15" fill="#1e293b" fontWeight="bold">在庫ファイル</text>

      {showExplanation && (
        <g>
          {/* プロセスの注釈 */}
          <rect x="380" y="8" width="100" height="30" rx="6" fill="#e2e8f0" stroke="#94a3b8" />
          <text x="430" y="28" textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight="bold">プロセス</text>
          <line x1="400" y1="38" x2="330" y2="74" stroke="#94a3b8" strokeWidth="1.5" />
          {/* データストアの注釈 */}
          <rect x="20" y="200" width="120" height="30" rx="6" fill="#e2e8f0" stroke="#94a3b8" />
          <text x="80" y="220" textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight="bold">データストア</text>
          <line x1="140" y1="208" x2="214" y2="184" stroke="#94a3b8" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  </FigCard>
);

// --- 問2：システム開発手法（ウォーターフォール型／プロトタイプ型／スパイラル型） ---
const KaihatsuFigure = () => {
  const Box = ({ x, y, w = 80, h = 36, label, fill = "#fef9c3" }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={fill} stroke="#a16207" strokeWidth="1.2" />
      <MultiText x={x + w / 2} y={y + h / 2 + 4} lines={label} lineH={13} fontSize={11} fill="#422006" fontWeight="bold" />
    </g>
  );
  return (
    <FigCard caption="図：システム開発手法の比較">
      <svg viewBox="0 0 680 430" className="w-full" style={{ maxHeight: 440 }}>
        <ArrowDefs id="kaiArw" color="#334155" />
        <ArrowDefs id="kaiNg" color="#2563eb" />
        <text x="340" y="22" textAnchor="middle" fontSize="15" fill="#0f172a" fontWeight="bold">システム開発手法</text>

        {/* ウォーターフォール型 */}
        <text x="10" y="52" fontSize="12" fill="#dc2626" fontWeight="bold">ウォーターフォール型</text>
        {[["基本計画"], ["外部設計"], ["内部設計"], ["開発"], ["テスト"], ["運用", "保守"]].map((lb, i) => (
          <Box key={i} x={8 + i * 110} y={60} label={lb} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={88 + i * 110} y1={78} x2={116 + i * 110} y2={78} stroke="#334155" strokeWidth="2" markerEnd="url(#kaiArw)" />
        ))}

        {/* プロトタイプ型 */}
        <text x="10" y="150" fontSize="12" fill="#dc2626" fontWeight="bold">プロトタイプ型</text>
        <Box x={8} y={160} label={["基本計画"]} />
        <Box x={120} y={160} label={["外部設計"]} />
        <Box x={232} y={160} w={96} label={["プロトタイプ", "作成"]} fill="#fed7aa" />
        <Box x={360} y={160} label={["内部設計"]} />
        <Box x={472} y={160} label={["開発"]} />
        <Box x={560} y={160} w={48} label={["テスト"]} />
        {/* 矢印 */}
        <line x1="88" y1="178" x2="116" y2="178" stroke="#334155" strokeWidth="2" markerEnd="url(#kaiArw)" />
        <line x1="200" y1="178" x2="228" y2="178" stroke="#334155" strokeWidth="2" markerEnd="url(#kaiArw)" />
        {/* OK 矢印 プロトタイプ作成→内部設計 */}
        <line x1="328" y1="178" x2="356" y2="178" stroke="#2563eb" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#kaiNg)" />
        <text x="342" y="172" textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="bold">OK</text>
        <line x1="440" y1="178" x2="468" y2="178" stroke="#334155" strokeWidth="2" markerEnd="url(#kaiArw)" />
        <line x1="552" y1="178" x2="558" y2="178" stroke="#334155" strokeWidth="2" markerEnd="url(#kaiArw)" />
        {/* NG ループ プロトタイプ作成→基本計画 */}
        <path d="M280,196 L280,224 L48,224 L48,198" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#kaiNg)" />
        <text x="164" y="238" textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="bold">NG</text>

        {/* スパイラル型 */}
        <text x="10" y="280" fontSize="12" fill="#dc2626" fontWeight="bold">スパイラル型</text>
        <Box x={280} y={295} w={110} h={34} label={["基本計画"]} fill="#fef9c3" />
        <Box x={430} y={350} w={90} h={34} label={["設計"]} fill="#fef9c3" />
        <Box x={290} y={398} w={90} h={28} label={["開発"]} fill="#fef9c3" />
        <Box x={150} y={350} w={90} h={34} label={["テスト"]} fill="#fef9c3" />
        {/* 時計回りの矢印 */}
        <path d="M390,318 Q440,330 460,348" fill="none" stroke="#2563eb" strokeWidth="2" markerEnd="url(#kaiNg)" />
        <path d="M460,386 Q420,408 382,410" fill="none" stroke="#2563eb" strokeWidth="2" markerEnd="url(#kaiNg)" />
        <path d="M290,412 Q240,408 215,388" fill="none" stroke="#2563eb" strokeWidth="2" markerEnd="url(#kaiNg)" />
        <path d="M205,350 Q230,322 278,314" fill="none" stroke="#2563eb" strokeWidth="2" markerEnd="url(#kaiNg)" />
      </svg>
    </FigCard>
  );
};

// --- 問3：PMBOK（プロジェクト・パフォーマンス領域：8つのドメイン） ---
const PmbokFigure = () => {
  const domains = [
    "ステークホルダー",
    "チーム",
    "開発アプローチとライフサイクル",
    "計画",
    "プロジェクト作業",
    "デリバリー",
    "パフォーマンスの測定",
    "不確実性",
  ];
  return (
    <FigCard caption="図：PMBOK 8つのパフォーマンス・ドメイン">
      <svg viewBox="0 0 620 470" className="w-full" style={{ maxHeight: 470 }}>
        <text x="310" y="26" textAnchor="middle" fontSize="16" fill="#0f172a" fontWeight="bold">◆PMBOK</text>
        {/* 親ボックス */}
        <rect x="14" y="44" width="180" height="50" rx="4" fill="#fbcfb1" stroke="#9a3412" strokeWidth="1.2" />
        <MultiText x={104} y={66} lines={["プロジェクト・", "パフォーマンス領域"]} lineH={16} fontSize={12} fill="#7c2d12" fontWeight="bold" />
        {/* 幹線 */}
        <line x1="104" y1="94" x2="104" y2="430" stroke="#1e293b" strokeWidth="1.5" />
        {domains.map((d, i) => {
          const y = 120 + i * 42;
          return (
            <g key={i}>
              <line x1="104" y1={y + 16} x2="250" y2={y + 16} stroke="#1e293b" strokeWidth="1.5" />
              <rect x="250" y={y} width="340" height="32" rx="4" fill="#fdebd0" stroke="#a16207" strokeWidth="1" />
              <text x="420" y={y + 21} textAnchor="middle" fontSize="13" fill="#422006" fontWeight="bold">{d}</text>
            </g>
          );
        })}
      </svg>
    </FigCard>
  );
};

// --- 問7：ファンクションポイント法の係数表（tableタグで再現） ---
const FpTable = () => (
  <FigCard caption="表：ファンクションポイント法">
    <div className="text-slate-900">
      <p className="mb-2 text-center text-sm font-bold">ファンクションポイント法</p>
      <table className="w-full border-collapse text-xs sm:text-sm">
        <thead>
          <tr>
            <th className="border border-slate-400 bg-amber-200 px-2 py-1 text-left">タイプ</th>
            <th className="border border-slate-400 bg-amber-200 px-2 py-1">簡単</th>
            <th className="border border-slate-400 bg-amber-200 px-2 py-1">普通</th>
            <th className="border border-slate-400 bg-amber-200 px-2 py-1">複雑</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["外部入力（入力画面など）", "3 × 数", "4 × 数", "6 × 数"],
            ["外部出力（帳票など）", "4 × 数", "5 × 数", "7 × 数"],
            ["外部照会（照会画面など）", "3 × 数", "4 × 数", "6 × 数"],
            ["内部論理ファイル（データベース等）", "7 × 数", "10 × 数", "15 × 数"],
            ["外部インターフェイス（外部システム連携など）", "5 × 数", "7 × 数", "10 × 数"],
          ].map((r, i) => (
            <tr key={i}>
              <td className="border border-slate-400 px-2 py-1">{r[0]}</td>
              <td className="border border-slate-400 px-2 py-1 text-center">{r[1]}</td>
              <td className="border border-slate-400 px-2 py-1 text-center">{r[2]}</td>
              <td className="border border-slate-400 px-2 py-1 text-center">{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs font-bold">※ 係数に機能数を掛けたものを合計し、ファンクションポイントを計算</p>
    </div>
  </FigCard>
);

// --- 問8：UML ユースケース図 ---
const UsecaseFigure = () => {
  const Actor = ({ x, label }) => (
    <g stroke="#1e293b" strokeWidth="1.5" fill="none">
      <circle cx={x} cy="70" r="8" />
      <line x1={x} y1="78" x2={x} y2="108" />
      <line x1={x - 14} y1="88" x2={x + 14} y2="88" />
      <line x1={x} y1="108" x2={x - 12} y2="128" />
      <line x1={x} y1="108" x2={x + 12} y2="128" />
      <text x={x} y="146" textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="bold" stroke="none">{label}</text>
    </g>
  );
  return (
    <FigCard caption="図：ユースケース図">
      <svg viewBox="0 0 500 170" className="w-full" style={{ maxHeight: 200 }}>
        <rect x="130" y="20" width="240" height="130" fill="none" stroke="#1e293b" strokeWidth="1.5" />
        <text x="250" y="38" textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="bold">注文システム</text>
        {[["注文を入力する", 58], ["注文を取り消す", 92], ["注文を照会する", 126]].map((u, i) => (
          <g key={i}>
            <ellipse cx="250" cy={u[1]} rx="78" ry="15" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
            <text x="250" y={u[1] + 4} textAnchor="middle" fontSize="11" fill="#1e293b">{u[0]}</text>
          </g>
        ))}
        <Actor x="50" label="顧客" />
        <Actor x="450" label="社員" />
        <line x1="64" y1="92" x2="172" y2="58" stroke="#1e293b" strokeWidth="1" />
        <line x1="64" y1="92" x2="172" y2="92" stroke="#1e293b" strokeWidth="1" />
        <line x1="64" y1="92" x2="172" y2="126" stroke="#1e293b" strokeWidth="1" />
        <line x1="436" y1="92" x2="328" y2="126" stroke="#1e293b" strokeWidth="1" />
      </svg>
    </FigCard>
  );
};

// --- 問8：UML クラス図（型の定義） ---
const ClassDefFigure = () => (
  <FigCard caption="図：クラス図（オブジェクトの「型」を定義）">
    <svg viewBox="0 0 240 220" className="w-full" style={{ maxHeight: 230 }}>
      <rect x="40" y="20" width="160" height="180" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <line x1="40" y1="52" x2="200" y2="52" stroke="#1e293b" strokeWidth="1.5" />
      <line x1="40" y1="140" x2="200" y2="140" stroke="#1e293b" strokeWidth="1.5" />
      <text x="120" y="42" textAnchor="middle" fontSize="14" fill="#1e293b" fontWeight="bold">注文</text>
      <MultiText x={120} y={72} lines={["注文番号", "日付", "商品", "数量"]} lineH={17} fontSize={12} fill="#1e293b" />
      <MultiText x={120} y={160} lines={["注文入力", "注文照会", "注文取消"]} lineH={17} fontSize={12} fill="#1e293b" />
    </svg>
  </FigCard>
);

// --- 問8：UML シーケンス図 ---
const SequenceFigure = () => {
  const Head = ({ x, label }) => (
    <g>
      <rect x={x - 50} y="14" width="100" height="34" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <text x={x} y="36" textAnchor="middle" fontSize="13" fill="#1e293b" fontWeight="bold">{label}</text>
    </g>
  );
  return (
    <FigCard caption="図：シーケンス図（オブジェクト間の処理プロセス）">
      <svg viewBox="0 0 600 420" className="w-full" style={{ maxHeight: 420 }}>
        <ArrowDefs id="seqArw" color="#1e293b" />
        <Head x="90" label="顧客" />
        <Head x="300" label="注文画面" />
        <Head x="510" label="倉庫" />
        {/* ライフライン */}
        {[90, 300, 510].map((x) => (
          <line key={x} x1={x} y1="48" x2={x} y2="410" stroke="#1e293b" strokeWidth="1" strokeDasharray="5 4" />
        ))}
        {/* 実行バー */}
        <rect x="80" y="90" width="20" height="300" fill="#ffffff" stroke="#1e293b" />
        <rect x="290" y="110" width="20" height="260" fill="#ffffff" stroke="#1e293b" />
        <rect x="500" y="150" width="20" height="170" fill="#ffffff" stroke="#1e293b" />
        {/* 商品検索 → */}
        <line x1="100" y1="130" x2="288" y2="130" stroke="#1e293b" strokeWidth="1.5" markerEnd="url(#seqArw)" />
        <text x="194" y="122" textAnchor="middle" fontSize="13" fill="#1e293b" fontWeight="bold">商品検索</text>
        {/* 在庫確認 → */}
        <line x1="310" y1="168" x2="498" y2="168" stroke="#1e293b" strokeWidth="1.5" markerEnd="url(#seqArw)" />
        <text x="404" y="160" textAnchor="middle" fontSize="13" fill="#1e293b" fontWeight="bold">在庫確認</text>
        {/* 確認結果 ⇠ */}
        <line x1="500" y1="240" x2="312" y2="240" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#seqArw)" />
        <text x="404" y="232" textAnchor="middle" fontSize="13" fill="#1e293b" fontWeight="bold">確認結果</text>
        {/* 検索結果 ⇠ */}
        <line x1="290" y1="300" x2="102" y2="300" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#seqArw)" />
        <text x="196" y="292" textAnchor="middle" fontSize="13" fill="#1e293b" fontWeight="bold">検索結果</text>
      </svg>
    </FigCard>
  );
};

// --- 問10解説：ERD（ER図） ---
const ErdFigure = () => {
  const Entity = ({ x, name, rows }) => (
    <g>
      <rect x={x} y="100" width="150" height="150" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <rect x={x} y="100" width="150" height="34" fill="#fef08a" stroke="#1e293b" strokeWidth="1.5" />
      <text x={x + 75} y="123" textAnchor="middle" fontSize="14" fill="#1e293b" fontWeight="bold">{name}</text>
      <MultiText x={x + 75} y={160} lines={rows} lineH={20} fontSize={13} fill="#1e293b" />
    </g>
  );
  return (
    <FigCard caption="図：ERD（ER図）　エンティティとリレーション">
      <svg viewBox="0 0 600 270" className="w-full" style={{ maxHeight: 280 }}>
        <Entity x="120" name="注文" rows={["注文No", "商品No", "・・・"]} />
        <Entity x="370" name="商品" rows={["商品No", "商品名", "・・・"]} />
        {/* リレーション（コネクタ） */}
        <line x1="270" y1="150" x2="370" y2="150" stroke="#1e293b" strokeWidth="1.2" />
        <path d="M370,150 L356,142 M370,150 L356,158 M356,150 L342,142 M356,150 L342,158" stroke="#1e293b" strokeWidth="1.2" fill="none" />
        {/* エンティティ注釈 */}
        <rect x="10" y="120" width="110" height="30" rx="6" fill="#e2e8f0" stroke="#94a3b8" />
        <text x="65" y="140" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="bold">エンティティ</text>
        <line x1="120" y1="135" x2="120" y2="135" stroke="#94a3b8" />
        <path d="M120,135 L150,130" stroke="#94a3b8" strokeWidth="1.2" />
        {/* リレーション注釈 */}
        <rect x="360" y="30" width="130" height="30" rx="6" fill="#e2e8f0" stroke="#94a3b8" />
        <text x="425" y="50" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="bold">リレーション</text>
        <line x1="380" y1="60" x2="330" y2="146" stroke="#94a3b8" strokeWidth="1.2" />
      </svg>
    </FigCard>
  );
};

// --- 問10解説：UMLクラス図（データと手続き） ---
const OrderClassFigure = () => (
  <FigCard caption="図：クラス図（データと処理＝メソッドを定義）">
    <svg viewBox="0 0 360 240" className="w-full" style={{ maxHeight: 250 }}>
      <rect x="100" y="20" width="200" height="200" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <rect x="100" y="20" width="200" height="38" fill="#fdba74" stroke="#1e293b" strokeWidth="1.5" />
      <text x="200" y="44" textAnchor="middle" fontSize="15" fill="#1e293b" fontWeight="bold">注文</text>
      <line x1="100" y1="135" x2="300" y2="135" stroke="#1e293b" strokeWidth="1.5" />
      <text x="112" y="82" fontSize="13" fill="#2563eb" fontWeight="bold">データ</text>
      <MultiText x={210} y={82} lines={["注文No", "商品No", "・・・"]} lineH={18} fontSize={13} fill="#1e293b" />
      <text x="112" y="170" fontSize="13" fill="#2563eb" fontWeight="bold">手続き</text>
      <MultiText x={210} y={170} lines={["注文入力", "注文照会", "・・・"]} lineH={18} fontSize={13} fill="#1e293b" />
    </svg>
  </FigCard>
);

// ===================================================================
// 図表の出し分けガードレール
// 問題画面（phase="problem"）では解答に直結する注釈を出さず、与条件のみを描画。
// 解説画面（phase="explanation"）になって初めて注釈つき図・解説図を描画する。
// ===================================================================
function renderFigures(qid, phase) {
  if (phase === "problem") {
    if (qid === 10) return <DfdFigure showExplanation={false} />;
    return null;
  }
  // phase === "explanation"
  switch (qid) {
    case 2:
      return <KaihatsuFigure />;
    case 3:
      return <PmbokFigure />;
    case 7:
      return <FpTable />;
    case 8:
      return (
        <>
          <UsecaseFigure />
          <ClassDefFigure />
          <SequenceFigure />
        </>
      );
    case 10:
      return (
        <>
          <DfdFigure showExplanation={true} />
          <ErdFigure />
          <OrderClassFigure />
        </>
      );
    default:
      return null;
  }
}

// ===================================================================
// 問題データ（添付DOCX「4-6スマート問題集 情報システムの開発」の
// 全16問・全選択肢・正解・解説・「ここが重要」レジュメをノンカット収録。
// 要約・省略は一切行わない。answer は 0 始まりのインデックス。
// category: process=開発手法・プロジェクト管理 / design=設計・テスト技法
// ===================================================================
const QUESTIONS = [
  {
    id: 1,
    title: "情報システム開発の流れ",
    source: "スマート問題集 4-6",
    category: "process",
    question: `　情報システムの開発プロセスに関して、次のa～cの順序として、最も適切なものを下記の解答群から選べ。

a　情報システム導入に必要な要員や費用の見積り
b　プログラムの機能や処理内容の設計
c　ユーザ・インターフェースの設計`,
    choices: [`a → b → c`, `a → c → b`, `b → c → a`, `c → a → b`],
    answer: 1,
    explanation: `正解：イ　a → c → b
aの「情報システム導入に必要な要員や費用の見積り」は、情報システムの開発プロセスの「基本計画」で行われます。bの「プログラムの機能や処理内容の設計」は、プログラム内部の仕様を設計することですから、「内部設計」で行われます。cの「ユーザ・インターフェースの設計」は、「外部設計」で行われます。なお、「外部設計」では、データベースの設計なども含まれます。基本的な流れとしては、外部設計→内部設計の順に行われますので、a→c→bの順序で実施されます。`,
    koko: `　本問では情報システムの開発プロセスについて問われています。
　情報システム開発の基本的な流れは、基本計画、設計、開発、テスト、運用･保守の手順となります。
●基本計画
　情報システムの基本的な計画を作成する段階であり、情報システムを企画する工程です。情報システムの要件を明確にする要件定義などを行います。
●設計
　設計では、基本計画で定義した要件に基づき、情報システムの機能を設計します。設計は、「外部設計」と「内部設計」に分けられます。外部設計では、利用者から見た仕様を設計します。内部設計では、プログラムの内部の仕様を設計します。
●開発
　設計で作成した各種の設計書を基に、データベースや各種のプログラムなどを開発していきます。
●テスト
　開発で作成したプログラムなどが、仕様どおりに動作するかをテストします。
●運用・保守
　定期的なバックアップ、利用者からの問合せ対応などを行います。
　情報システムの開発プロセスについて理解しておきましょう。`,
  },
  {
    id: 2,
    title: "情報システムの開発手法",
    source: "スマート問題集 4-6",
    category: "process",
    question: `　情報システムの開発手法に関する記述として、最も適切なものはどれか。`,
    choices: [
      `ウォーターフォール型のシステム開発では、システムの機能や構造を決める内部設計が行われた後に、ユーザ・インターフェースなどを決める外部設計が行われる。`,
      `RADは、ウォーターフォール型のシステム開発プロセスを、より短期間で実施できることを目的とした手法である。`,
      `スパイラル型のシステム開発では、システムの部分単位に開発プロセスを繰り返しながら、徐々にシステムの完成度を高めていく。`,
      `プロトタイピングでは、プロトタイプが問題ないことをユーザに確認してもらえば、その後に開発する本格的なシステムは問題なく稼働する。`,
    ],
    answer: 2,
    explanation: `ア　×：
　ウォーターフォール型では、外部設計を行ってから、内部設計が行われます。
イ　×：
　RAD（Rapid Application Development）は、プロトタイプ型と同じく試作品を作って開発を進める手法です。プロトタイプを完成イメージに近付けるため、製作と評価を繰り返しながら開発が進められます。
ウ　○：
　スパイラル型の説明に関する、正しい記述です。
エ　×：
　プロトタイピング（プロトタイプ型）は、プロトタイプが問題ないことをユーザに確認してもらいますが、その後に本格的なシステムを開発するプロセスではテストを行います。`,
    koko: `　本問では情報システムの開発手法について問われています。
　情報システムの開発手法を、開発の手順で大きく分類すると、ウォーターフォール型、プロトタイプ型、スパイラル型の開発手法があります。
　ウォーターフォール型は、上流工程から順番に実施していく方法です。ウォーターフォール型では、基本計画を最初に実行し終了してから、設計に移ります。設計が終了した後に、開発に移り、最後にテストを実行して運用を開始します。
　プロトタイプ型は、プロジェクトの早い段階で、プロトタイプ（試作品）を作成し、それをユーザが確認してから本格的に開発する方法です。
　スパイラル型は、設計、開発、テストという手順を何度もくり返すことで、徐々にシステムを成長させていく開発手法です。

　情報システムの開発手法について理解しておきましょう。`,
  },
  {
    id: 3,
    title: "PMBOK",
    source: "スマート問題集 4-6",
    category: "process",
    question: `プロジェクト管理の知識体系であるPMBOK（第７版まで）に関する記述として、最も不適切なものはどれか。`,
    choices: [
      `PMBOKは、情報システム以外のプロジェクトにも対応している。`,
      `PMBOKでは、プロジェクトマネジメントの12の原理・原則、プロジェクトマネジメントの10の知識エリアが定義されている。`,
      `PMBOKは、米国プロジェクトマネジメント協会（PMI）が策定・改定している。`,
      `WBSは、成果物を得るために必要な工程や作業について記述する。`,
    ],
    answer: 1,
    explanation: `ア　○：
正しい記述です。PMBOKは、情報システムに限らず、プロジェクトマネジメントの遂行に必要な基本的な知識を汎用的な形で体系立てて整理したものです。

イ　×：
PMBOK第7版では、「10の知識エリア」という概念がなくなり、「8のパフォーマンス・ドメイン」という概念が登場しました。

ウ　○：
正しい記述です。なお、米国プロジェクトマネジメント協会（PMI）では、PMBOKに準拠した国際的な認定制度「PMP」(Project Management Professional)を展開しています。

エ　○：　PMBOKのスコープマネジメントにて、WBSが取り上げられています。WBS（Work Breakdown Structure）とは、プロジェクトの全ての作業を階層構造で表したものです。`,
    koko: `本問ではPMBOKについて問われています。

PMBOK（Project Management Body of Knowledge）は、プロジェクト管理の方法を体系的にまとめたものであり、プロジェクト管理の知識に関する国際標準と位置づけられます。
PMBOK第7版では、プロジェクトマネジメントの12の原理・原則、プロジェクトマネジメントの８つのパフォーマンス・ドメイン（活動する領域）が定義されています。

2021年に発表された第7版(PMBOK7）では、「10の知識エリア」という概念がなくなり、「8のパフォーマンス・ドメイン」という概念が登場しました。
PMBOKの概要について理解しておきましょう。`,
  },
  {
    id: 4,
    title: "EVMS",
    source: "スマート問題集 4-6",
    category: "process",
    question: `　システム開発プロジェクトの管理に使われるEVMSに関する記述として、最も不適切なものはどれか。`,
    choices: [
      `EVMSでは、プロジェクトの全ての作業を金銭価値に置きなおし、プロジェクトの進捗において、作業の進捗度を金額で表現することで管理する。`,
      `EVMSを用いると、進捗状況が明確になるが、計画変更の管理が煩雑になりやすいという問題がある。`,
      `EVMSでは、アーンドバリューとベースラインを比較することで、進捗度合いを定量的に把握する。`,
      `EVMSは、小規模なプロジェクトでの適用には向いているが、大規模プロジェクトには向かない。`,
    ],
    answer: 3,
    explanation: `ア　○：
　正しい記述です。EVMSは、作業の工数を金額に換算する点が特徴です。
イ　○：
　EVMSでは、プロジェクトの計画および進捗度合いを金額として表して比較することにより、進捗状況を定量的に把握することができます。ただし、計画変更があった場合、再度、金額に換算する必要があることなどから、計画変更時の管理は煩雑になります。
ウ　○：
アーンドバリューとは、作業の進捗を金額で表したものであり、ベースラインとは、作業の見積もりを金額に換算して計算したものです。
エ　×：
　EVMSは、厳密に管理できる一方で、管理のための手間がかかることから、小規模プロジェクトよりもむしろ大規模プロジェクトに向いています。`,
    koko: `　本問ではEVMSについて問われています。
　EVMS（Earned Value Management System：出来高管理システム）とは、プロジェクトの進捗管理をする方法であり、作業の進捗度を金額で表現することで管理します。
　EVMSでは、プロジェクト計画の際に、WBSの作業を全て金額に換算します。これは、各作業の工数を見積り、それを金額に換算することで計算できます。この計画のことをベースラインと呼びます。また、全ての作業の金額を積み上げたものが、プロジェクトの予算となります。
　プロジェクトの実行時には、作業の進捗度合いをアーンドバリューとして金額で表します。これを計画であるベースラインと比較することで、進捗度合いを定量的に把握することができます。
　EVMSの概要について理解しておきましょう。`,
  },
  {
    id: 5,
    title: "要件定義",
    source: "スマート問題集 4-6",
    category: "process",
    question: `　情報システムの要件定義に関する記述として、最も不適切なものはどれか。`,
    choices: [
      `要件定義では、システムの仕様およびシステム化の範囲と機能を明確にし、利害関係者間で合意する。`,
      `数値化していない要件は、それを満たしているか否かの判断基準が人によって異なるため、数値化すべきである。`,
      `要件は漏れなく明確化する必要があるため、未確定な部分があるときは決定を先送りすべきである。`,
      `要件定義では、システム利用者のニーズの整理を行う。`,
    ],
    answer: 2,
    explanation: `ア　○：
　正しい記述です。情報システムの開発における業務要件を定義する目的を表しています。
イ　○：
　正しい記述です。要件定義では、数値化できるものは、極力、数値化します。例えば、「速やかに」と言っても、人によって判断基準はことなります。そのため、障害発生時の復旧について、「速やかに」というような表現ではなく、「1分以内に復旧」とか「1時間以内に復旧」などというように数値化します。また、数値化されていても誤りはあります。例えば、使用する単位が違えば結果は大きく変わります。単位まで含めて確認し、決めなければなりません。
ウ　×：
　要件は次の工程のインプットになるため、漏れなく明確化する必要がありますが、未確定な部分があるときは先送りすることなく、対象範囲として含めるもしくは含めないなど決定すべきです。
エ　○：
　正しい記述です。要件定義では、ユーザーヒアリングなどにより、システム利用者のニーズを整理して、現状の業務プロセスの改善点や、要件を洗い出していきます。`,
    koko: `　本問では情報システムの要件定義について問われています。
　要件定義は、情報システム開発の最初の工程である「基本計画」にて行われます。
　要件定義の一般的な流れとしては、最初に経営上解決したい課題を基に、情報システムの目的と業務範囲を決定します。
　次に、対象範囲について、現状の業務プロセスや情報システムを分析します。
　さらに、ユーザーヒアリングなどにより、現状の業務プロセスの改善点や、新たな要件を洗い出していきます。
　要件定義について理解しておきましょう。`,
  },
  {
    id: 6,
    title: "RFPとRFI",
    source: "スマート問題集 4-6",
    category: "process",
    question: `　ユーザ企業がITベンダーに提出する文書に関する記述として、最も適切なものはどれか。`,
    choices: [
      `RFIとは、システムが提供するサービスの品質保証やペナルティに関する契約内容を明らかにし、ITベンダーと合意する文書をいう。`,
      `SLAとは、発注先候補のITベンダーに情報提供を依頼する文書をいう。`,
      `RFP とは、ITベンダーからの提案を評価・検討し、システム開発を依頼する文書をいう。`,
      `RFP とは、システムの概要や主要な機能などに関する提案を依頼する文書をいう。`,
    ],
    answer: 3,
    explanation: `ア　×：
　選択肢の記述の内容は、SLAの説明です。RFIは、情報システムの導入や業務委託を行うにあたり、発注先候補のシステム開発会社に情報提供を依頼するための文書です。
イ　×：
　選択肢の記述の内容は、RFIの説明です。SLAは、サービス提供者とサービス委託者との間で、提供するサービス内容と範囲・品質に対する水準などを、あらかじめ定めておくものです。約束した水準などが達成できなかった場合のルールも、あらかじめ決めておきます。
ウ　×：
　選択肢の記述の内容は、システム開発の発注書の説明です。
エ　○：
　正しい記述です。RFP は、システム開発の発注に先立ち、システムの概要や主要な機能などに関する提案を依頼する文書のことです。`,
    koko: `　本問では、ユーザ企業がITベンダーに提出する文書の種類について問われています。

　RFI(Request For Information)とは、情報提供依頼書と訳され、情報システムの導入や業務委託を行う際に、発注先候補のシステム開発会社に情報提供を依頼する文書のことです。
　SLA（Service Level Agreement）は、サービス提供者とサービス委託者との間で、提供するサービス内容と範囲、品質に対する水準を定め、それが達成できなかった場合のルールをあらかじめ合意しておく文書・契約のことです。
　RFP（Request For Proposal：提案依頼書）は、ITベンダーなどの業者から具体的な提案をしてもらうために、システムに対する要件を伝えるための文書のことです。

　ITベンダーに提出する文書について理解しておきましょう。`,
  },
  {
    id: 7,
    title: "工数と費用の見積り",
    source: "スマート問題集 4-6",
    category: "process",
    question: `　情報システム開発の工数と費用の見積りに関する次の文中の空欄Ａ～Ｃに入る語句の組み合わせとして、最も適切なものを下記の解答群から選べ。
　情報システムの開発工数を見積る手法の1つとして、システムの持つ機能をもとに、機能ごとの複雑さなどから（　Ａ　）という点数をつけて評価する方法がある。
　この方法では、まずシステムの機能を洗い出し、機能のタイプごとに機能の数を数えます。次に、機能ごとに複雑さを評価し、（ Ｂ　）段階のタイプに分けます。さらに、各タイプ別の係数を掛けて（　Ａ　）を計算します。
　これは、詳細なプログラムなどの設計の（　Ｃ　）に行われます。`,
    choices: [
      `Ａ：ファンクションポイント　Ｂ：3　Ｃ：前`,
      `Ａ：スコアリングモデル　Ｂ：4　Ｃ：前`,
      `Ａ：ファンクションポイント　Ｂ：4　Ｃ：後`,
      `Ａ：スコアリングモデル Ｂ：3　Ｃ：後`,
    ],
    answer: 0,
    explanation: `A：ファンクションポイント
　スコアリングモデルとは、定性的な評価項目を定量化する方法です。定性的な評価項目のそれぞれに対して重み付けをして、一つの数式で表現し定量化します。
B：3
　ファンクションポイント法では、機能ごとに複雑さを評価して、「簡単」「普通」「複雑」の3段階に分けます。
C：前
　このような開発工数の見積もりは、詳細なプログラムを設計する前の「基本設計」のプロセスにて行われます。ファンクションポイント法では、必要な機能が分かった段階で工数と費用の概算見積りを行うことができます。`,
    koko: `　本問ではファンクションポイント法について問われています。
　ファンクションポイント法は、開発工数の見積りの代表的な方法の１つです。ファンクションポイント法は、機能（ファンクション）ごとの複雑さによって点数を付け、その点数を合計することによって工数を見積る方法です。この点数のことを「ファンクションポイント」と呼びます。
　ファンクションポイント法では、まずシステムの機能を洗い出し、機能のタイプごとに機能の数を数えます。次に、機能ごとに複雑さを評価し、「簡単」「普通」「複雑」の3段階に分けます。さらに、図の表のような係数を掛けてファンクションポイントを計算します。

　ファンクションポイント法について理解しておきましょう。`,
  },
  {
    id: 8,
    title: "UML",
    source: "スマート問題集 4-6",
    category: "design",
    question: `　業務システムの分析・設計に用いられるUMLに関する記述として、最も適切なものはどれか。`,
    choices: [
      `UMLは、オブジェクト指向によるシステム開発の方法論である。`,
      `UMLにて、設計図をどのような順序で用いるかは、UML標準で決められている。`,
      `ネットワーク図は、オブジェクト間の処理プロセスを表現するUMLのダイアグラムの1つである。`,
      `ユースケース図は、システムにどのような利用者がいるか、その利用者がどのような操作をするかを表すUMLのダイアグラムの１つである。`,
    ],
    answer: 3,
    explanation: `ア　×：
　UMLは、オブジェクト指向アプローチのシステム開発における、設計図の統一表記法です。システム開発に関する方法論は含まれていません。
イ　×：
　UMLは、設計図の種類や書き方を定義したものであり、方法論は含まれていないため、どの設計書をどういう順序で使うかは定められていません。
ウ　×：
　シーケンス図の説明に関する記述です。UMLにネットワーク図というダイアグラムは含まれていません。
エ　○：
　正しい記述です。ユースケース図では、機能をユースケースで表し、機能を利用する人や外部システムをアクターで表して、これらの関係を表現します。`,
    koko: `　本問ではUMLについて問われています。
　UMLは、オブジェクト指向アプローチのシステム開発における、設計図の統一表記法です。
　オブジェクト指向アプローチでは、データと処理をカプセル化してオブジェクトにすることで、オブジェクトを部品のように組み合わせて開発をすることができます。
　UMLでは、システム開発の様々な段階で使用する、各種の図表が定義されています。UMLの代表的な図表には次のようなものがあります。
●ユースケース図
　要件定義などの上流工程で、業務の機能を表現するために使われる

●クラス図
　オブジェクトの「型」を定義する

●シーケンス図
　オブジェクト間の処理プロセスを表す。

　UMLの基本について理解しておきましょう。`,
  },
  {
    id: 9,
    title: "情報システムの設計1",
    source: "スマート問題集 4-6",
    category: "design",
    question: `　情報システムの設計に関する記述として、最も適切なものはどれか。`,
    choices: [
      `DFDは、プロセス指向アプローチで用いられ、データの流れと時間的情報を記述する手法である。`,
      `ER図は、データ指向アプローチで用いられる図表であり、データ間の関連を描画する。`,
      `STDは、オブジェクト指向アプローチで用いられる、モデリング言語の１つである。`,
      `DOAでは、システム開発後のデータ構造の変更が必要な際、一部のプログラムへの影響で抑えられやすい。`,
    ],
    answer: 1,
    explanation: `ア　×：
　DFDは、データの処理の流れを記述しますが、時間的情報については記述されません。
イ　○：
　正しい記述です。なお、ER図は、ERD（Entity-Relationship Diagram）とも呼ばれます。
ウ　×：
　STDは、状態遷移図とも呼ばれ、システムの状態がイベントによってどのように変わるのかを表した図で、外部設計や内部設計において、主に画面設計の際に用いられます。オブジェクト指向アプローチで用いられるモデリング言語としては、UMLがあります。
エ　×：
　DOAでは、プログラムを追加・変更するときには、データ構造は変更しなくて良いため、システムの変更や拡張に対応しやすいというメリットがあります。一方で、データ構造を変更する場合は、関連するプログラムを全て変更する必要があります。`,
    koko: `　本問では情報システムの設計について問われています。
　情報システムの設計アプローチには、POA（プロセス指向アプローチ）、DOA（データ指向アプローチ）、OOA（オブジェクト指向アプローチ）などがあります。
　POAでは、対象とする業務プロセスに着目します。業務プロセスを、フローチャートやDFD（データフローダイアグラム）などの図表を使ってモデリングし、それを基にシステムを開発します。フローチャートは、処理の流れを表した図表であり、処理の順番や条件による処理の分岐などを表します。DFDは、データと処理の流れを表す図表です。
　DOAでは、データ構造に着目するアプローチです。データ構造をE-Rモデルなどの図表を使って表します。E-Rモデルでは、データ構造を、データの集合であるエンティティと、エンティティ間のつながりであるリレーションで表します。
　情報システムの設計アプローチについて理解しておきましょう。`,
  },
  {
    id: 10,
    title: "情報システムの設計2",
    source: "スマート問題集 4-6",
    category: "design",
    question: `　情報システムの設計に用いられる下記の図に関する説明として、最も適切なものを下記の解答群の中から選べ。

[解答群]`,
    choices: [
      `データベースをどのように構築したらいいかを示すERDである。`,
      `業務とデータの処理の関係を記述したDFDである。`,
      `データと処理をセットにしたクラス図である。`,
      `図中の「商品ファイル」や「在庫ファイル」は、データマートと呼ばれる。`,
    ],
    answer: 1,
    explanation: `ア　×：
　図はDFDであるため、記述は不適切です。
イ　○：
　正しい記述です。
ウ　×：
　図はDFDであるため、記述は不適切です。
エ　×：
　図中の「商品ファイル」や「注文ファイル」は、データストアです。データマートとは、全社のデータが蓄積されたデータウェアハウスから、テーマ別にデータを抽出したものであり、BI（Business Intelligence）にて利用されます。`,
    koko: `　本問では情報システムの設計で用いられる図表について問われています。
　POA（プロセス指向アプローチ）で用いられる、データと処理の流れを表す図表であるDFD（データフローダイアグラム）は、次のように記述されます。

　DOA（データ指向アプローチ）で用いられる、構造を表す図表であるERD（ER図）は、次のように記述されます。

　データ構造を、データの集合であるエンティティと、エンティティ間のつながりであるリレーションで表します。
　データ構造をE-Rモデルなどの図表を使って表します。E-Rモデルでは、データ構造を、データの集合であるエンティティと、エンティティ間のつながりであるリレーションで表します。
　OOA（オブジェクト指向アプローチ）で用いられる、UMLのクラス図は、次のように記述されます。

　オブジェクトに含まれるデータの種類や、処理であるメソッドの種類を定義したクラスを表します。
　情報システムの設計に用いられる図表について理解しておきましょう。`,
  },
  {
    id: 11,
    title: "XP（エクストリーム･プログラミング）",
    source: "スマート問題集 4-6",
    category: "process",
    question: `　XP（エクストリーム･プログラミング）に関する記述として、最も不適切なものはどれか。`,
    choices: [
      `XPはアジャイル開発の手法の１つであり、小規模なシステムの開発に向いている。`,
      `XPでは、設計・開発・テストを繰り返して、システム開発を進めていく。`,
      `XPのプラクティスとして、ビジュアルプログラミングが定められている。`,
      `XPでは、原理とすべき価値と具体的なプラクティスが定められている。`,
    ],
    answer: 2,
    explanation: `ア　○：
　正しい記述です。XPを含め、アジャイル開発は比較的小規模なシステムの開発に向いています。
イ　○：
　アジャイル開発手法では、開発対象を多数の小さな機能に分割し、1つの反復 (イテレーション) で1機能を開発します。 イテレーションのサイクルを継続して行い、機能を追加開発していきます。各イテレーションの中では、設計、開発（コーディング）、テストといった工程を行います。
ウ　×：
　XPには、複数のプラクティスが定められていますが、ビジュアルプログラミングというプラクティスは含まれていません。XPの代表的なプラクティスとして、ペアプログラミングが挙げられます。ペアプログラミングでは、1人がプログラムのコードを書き、隣にいるもう1人が同時にそれをチェックしながら作業を進めます。これにより、集中力を高め、コードのチェックをしながら作業を進行することができます。
エ　○：
　XPでは、原理とすべき価値が定められています。XPの価値とは、「コミュニケーション」、「シンプル」、「フィードバック」、「勇気」、「尊重」です。これらの価値に基づいて、具体的なプラクティス（実践）が定められています。`,
    koko: `　本問ではXP（エクストリーム･プログラミング）について問われています。
　近年では、経営のスピードが向上したため、従来よりも速いスピードで開発する方法が考えられています。迅速にプログラムを開発する手法は、アジャイル開発プロセスと呼ばれます。
　アジャイル開発プロセスの具体的な手法の1 つに、XP（エクストリーム･プログラミング）があります。
　XPでは、プロジェクトを短い期間に区切り、この期間の中で反復的に設計・開発・テストを繰返します。小さな部品単位で動作を確認しながら開発をすることで、後戻りが少なくなるため、開発期間を短縮することができます。
　XPの特徴について理解しておきましょう。`,
  },
  {
    id: 12,
    title: "RAD（Rapid Application Development）",
    source: "スマート問題集 4-6",
    category: "process",
    question: `　RAD（Rapid Application Development）に関する記述として、最も適切なものはどれか。`,
    choices: [
      `RADは、比較的長期間のプロジェクトに適用される開発手法である。`,
      `RADでは、開発サイクルを繰り返すことによって、システムの完成度を高めていく。`,
      `RADでは、エンジニアだけでなく、エンドユーザも含めたチームでプロジェクトを進める。`,
      `RADで用いられるCASEツールは、コーディングやテスト工程の生産を高めるためのものであり、設計工程は対象としていない。`,
    ],
    answer: 2,
    explanation: `ア　×：
　RADは、小規模・短期間のプロジェクトに適用される手法です。
イ　×：
　RADは、プロトタイプと呼ばれるシステムの完成イメージを何度も制作、評価し、次第に完成品に近づけていきます。開発サイクルを繰り返すことによって、システムの完成度を高めていく手法は、スパイラルモデルと言います。
ウ　○：
　正しい記述です。RADでは、プロトタイプをエンドユーザが評価・確認しながら、開発を進めていきます。
エ　×：
　CASEツールは、従来は人間の手で行っていた、設計工程や、プログラミングの作業を、コンピュータで支援するためのソフトウェアです。CASE ツールには、設計など上流工程を支援する「上流CASEツール」、プログラミングなどの下流工程を支援する「下流CASEツール」があります。また、これらを統合した「統合CASEツール」もあります。`,
    koko: `　本問ではRAD（Rapid Application Development）について問われています。
　RAD（Rapid Application Development）は、プロトタイプと呼ばれるシステムの完成イメージを何度も制作、評価し、プロトタイプを次第に完成品に近づけてゆく手法です。ウォーターフォールモデルなど従来の手法より迅速に開発を進められます。
　システム開発の工程をプロトタイピングやCASEツールなどの手法を用いることで、エンドユーザを含む少人数のチームで担当し、開発期間を短縮します。
　RADについて理解しておきましょう。`,
  },
  {
    id: 13,
    title: "システムテスト",
    source: "スマート問題集 4-6",
    category: "design",
    question: `　システムテスト（総合テスト）に関する記述として、最も適切なものはどれか。`,
    choices: [
      `システムテストでは、想定される最大業務負荷に耐えられるかどうかの確認が行われる。`,
      `システムテストでは、主にモジュールやプログラム間のインターフェースや相互の関連性を検証する。`,
      `システムテストでは、適正なデータを用いてテストを行い、例外処理は対象としなくてよい。`,
      `システムテストは、利用ユーザが中心となって行う。`,
    ],
    answer: 0,
    explanation: `ア　○：
　正しい記述です。システムテストでは、情報システム全体の性能のテストも行われ、想定される最大業務負荷に耐えられるかどうかの確認が行われます。これを、性能テストや負荷テストとも呼ばれます。
イ　×：
　モジュールやプログラム間のインターフェースや相互の関連性を検証するのは、結合テストです。
ウ　×：
　システムテストでは、正常な処理だけではなく、例外処理についてもテストを行います。これは例外テストとも呼ばれます。
エ　×：
　システムテストは、情報システム部門やソフトウェアハウスなどが中心となって行われます。ちなみに、検収テストは、利用ユーザが中心となって行われます。`,
    koko: `　本問では情報システムのテストについて問われています。
　情報システムのテストでは、単体テスト、結合テスト、システムテスト、検収テストという順番で行われます。
　単体テストは、プログラムの最小単位であるモジュールごとのテストであり、モジュールが仕様どおりに動作するかを確認します。
　結合テストは、複数のモジュールの組み合わせをテストします。
　システムテストは、総合テストとも呼ばれ、情報システム全体の機能や性能などを確認します。
　検収テストは、完成した情報システムを、システム部門からユーザ部門に引き渡す時に行います。検収テストは、受入テストと呼ばれ、ユーザの受入ができるかを確認するという意味があります。
　情報システムのテストについて理解しておきましょう。`,
  },
  {
    id: 14,
    title: "ウォークスルー",
    source: "スマート問題集 4-6",
    category: "design",
    question: `　ソフトウェア品質レビュー技法のうち、ウォークスルーに関する記述として、最も適切なものはどれか。`,
    choices: [
      `プログラム作成者、進行まとめ役、記録役、説明役、レビュー役を明確に決めて、厳格なレビューを公式に行う。`,
      `プログラムを動作させて行う動的テストの１つである。`,
      `システム開発者が集まって実施され、プロジェクト責任者は参加が必須である。`,
      `システム開発の早い時期で、欠陥を発見するために行われる。`,
    ],
    answer: 3,
    explanation: `ア　×：
　インスペクションに関する記述です。ウォークスルーは公式なレビューではありません。
イ　×：
　ウォークスルーやインスペクションは、プログラムを動作させて行う動的テストではなく、プログラムの動作を伴わない静的テストです。
ウ　×：
　ウォークスルーは、システム開発者が集まって実施されますが、プロジェクト責任者は参加が必須ではありません。必要に応じて、インフォーマルに開発者が集まって実施します。
エ　○：
　正しい記述です。ソフトウェアが完成する前の工程で、問題点を発見して、早期に欠陥を除去するために行われます。`,
    koko: `　本問ではウォークスルーについて問われています。
　ウォークスルーは、ソフトウェア開発の各工程で作成された成果物（設計書やプログラムなど）について、問題点が無いかを集団で検証する作業です。同様の目的で行われる作業にインスペクションがあります。
　インスペクションは、各工程の終わりに、関係者が集まって集団で成果物を確認し、欠陥を指摘します。欠陥があった場合は修正するかを判断します。インスペクションは公式なもので、プロジェクト責任者の下で厳密に行います。
　ウォークスルーは、インスペクションほど公式・厳密なものではなく、開発者達が運営するものです。
　インスペクションおよびウォークスルーの特徴について理解しておきましょう。`,
  },
  {
    id: 15,
    title: "ホワイトボックステスト、ブラックボックステスト",
    source: "スマート問題集 4-6",
    category: "design",
    question: `　ホワイトボックステストやブラックボックステストに関する記述として、最も適切なものはどれか。`,
    choices: [
      `ホワイトボックステストでは、分岐命令やモジュールの数が増えると、テストデータが急増する。`,
      `ブラックボックステストでは、テストデータの作成基準として、命令や分岐の網羅率を使用する。`,
      `ホワイトボックステストでは、プログラムの入力と出力の関係に注目してテストデータを作成する。`,
      `ブラックボックステストは、単体テストでのみ実施される。`,
    ],
    answer: 0,
    explanation: `ア　○：
　ホワイトボックステストでは、プログラム中の分岐命令やモジュールなどの数が増えると、テスト対象として、それらの条件分岐やモジュールの組み合わせの数が等比級数的に増加します。
イ　×：
　網羅率とは、ホワイトボックステストを行うときに用いる基準で、プログラムに対して、どの程度テストを実施したかを表すための指標です。プログラム中の処理経路について、漏れなく網羅的にテストを行うことが理想であるが、プログラムのボリュームによっては、すべての処理経路を完全に網羅することは非常に困難です。その際、網羅率に基準を設けて、テストデータを作成しテストを実施します。
ウ　×：
　プログラムの入力と出力の関係に注目してテストデータを作成するのは、ブラックボックステストです。ホワイトボックステストでは、プログラムの内部構造に着目してテストデータを作成します。
エ　×：
　ブラックボックステストは、単体テストだけでなく、結合テストやシステムテスト、検収テストの段階でも行われます。`,
    koko: `　本問ではホワイトボックステストとブラックボックステストについて問われています。
　ホワイトボックステストは、プログラムの内部構造に注目して、プログラムが意図したとおりに動作しているかを確認するテストです。プログラムには、命令文や条件分岐などが含まれますが、それらについて漏れなく網羅的にテストを行います。
　ブラックボックステストは、プログラムの入力と出力に注目して、さまざまな入力に対して、プログラムの仕様どおりの出力が得られるかを確認するテストです。その際、プログラム内部の動作は問題にしません。正常な入力を与えて検証するだけでなく、不正な入力を与えて、例外処理が正しく実行されるかについても検証します。
　ホワイトボックステストとブラックボックステストの特徴について理解しておきましょう。`,
  },
  {
    id: 16,
    title: "結合テスト",
    source: "スマート問題集 4-6",
    category: "design",
    question: `　結合テストに関する記述として、最も不適切なものはどれか。`,
    choices: [
      `結合テストの方法の１つにビッグバンテストがあり、複数のモジュールを一挙に結合して、その動作を検証する。`,
      `ビッグバンテストでは、結合テスト全体の時間が短縮できるメリットがある一方、バグのある箇所の特定が難しく、かえって時間がかかってしまったり、バグが残りやすくなったりするなどのリスクもある。`,
      `上位のモジュールから順番に結合してテストをしていく手法をトップダウンテストという。また、下位のモジュールから順番に結合してテストをしていく手法のことを、ボトムアップテストという。`,
      `上位モジュールと下位モジュールを結合してテストを実施したいが上位モジュールが完成していない場合、スタブと呼ばれるダミーモジュールを作ってテストする。`,
    ],
    answer: 3,
    explanation: `ア　○：
　ビッグバンテストの内容の説明として、適切です。
イ　○：
　ビッグバンテストの特徴の説明として、適切です。
ウ　○：
　トップダウンテストとボトムアップテストの概要の説明として、適切です。
エ　×：
　スタブとは、下位モジュールが完成していない場合に使われるダミーモジュールのことです。上位モジュールが完成していない場合に使われるダミーモジュールは、ドライバと呼ばれます。`,
    koko: `　本問では結合テストの種類や詳細について問われています。
　上位のモジュールから順番に結合してテストをしていく手法をトップダウンテストといいます。上位のモジュールに下位のモジュールを組み合わせる際、まだ下位のモジュールが完成していない場合があります。その際、下位のモジュールのダミーを利用しますが、そのダミーモジュールのことをスタブといいます。
　下位のモジュールから順番に結合してテストをしていく手法のことを、ボトムアップテストといいます。下位のモジュールに上位のモジュールを組み合わせる際、まだ上位のモジュールが完成していない場合があります。その際、上位のモジュールのダミーを使いますが、そのダミーモジュールのことをドライバといいます。
　結合テストは、組み合わせるモジュールの数を、少しずつ増やしていくことが一般的です。しかし、すべてのモジュールを組み合わせて、一斉に結合テストを実施する方法もあります。この方法をビッグバンテストといいます。ビッグバンテストでは、結合テスト全体の時間が短縮できるメリットがありますが、場合によっては、バグのある箇所の特定が難しく、かえって時間がかかってしまったり、バグが残りやすくなったりするなどのリスクもあります。
　結合テストのバリエーションについて、押さえておくようにしましょう。`,
  },
];

const TOTAL = QUESTIONS.length;
const CAT_LABEL = {
  process: "開発手法・プロジェクト管理",
  design: "設計・テスト技法",
};

// ===================================================================
// 永続化ヘルパー（Firestore優先・LocalStorageフォールバック）
// ===================================================================
const lsKey = (userId) => `${APP_ID}__${userId}`;

function loadLocal(userId) {
  try {
    const raw = localStorage.getItem(lsKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("[LocalStorage] 読み込み失敗", e);
    return null;
  }
}

function saveLocal(userId, data) {
  try {
    localStorage.setItem(lsKey(userId), JSON.stringify(data));
  } catch (e) {
    console.warn("[LocalStorage] 保存失敗", e);
  }
}

// ===================================================================
// メインコンポーネント
// ===================================================================
export default function App() {
  // 認証・初期化
  const [authReady, setAuthReady] = useState(false);

  // 画面：login / dashboard / quiz / result
  const [screen, setScreen] = useState("login");
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // ユーザー識別（合言葉）
  const [inputId, setInputId] = useState("");
  const [userId, setUserId] = useState("");

  // 学習データ
  const [history, setHistory] = useState({}); // { [id]: { correct, answeredAt } }
  const [reviews, setReviews] = useState({}); // { [id]: true }
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressMode, setProgressMode] = useState("all");

  // 途中再開モーダル
  const isFirstLoad = useRef(true);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(null);

  // クイズ進行
  const [mode, setMode] = useState("all"); // all / wrong / review
  const [quizList, setQuizList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // --- 匿名認証（Firestoreアクセス前に必ず実行） ---
  // 【重要】認証成功は「通信できる状態になっただけ」。これだけではログイン扱いにしない。
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (auth) {
        try {
          await signInAnonymously(auth);
          console.log("[Auth] 匿名サインイン成功（※まだログイン未完了。合言葉入力を待つ）");
        } catch (e) {
          console.warn("[Auth] 匿名サインイン失敗。LocalStorageで動作します。", e);
        }
      }
      if (mounted) {
        setAuthReady(true);
        console.log("[Init] 初期化完了（authReady=true / 画面はloginのまま）");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- userId 変更時に再開判定フラグをリセット ---
  useEffect(() => {
    isFirstLoad.current = true;
  }, [userId]);

  // --- データ購読（Firestore onSnapshot / LocalStorageフォールバック） ---
  useEffect(() => {
    if (!userId) return;

    const applyData = (data, allowResumeTrigger) => {
      const parsed = {
        progressIndex: Number(data?.progressIndex || 0),
        progressMode: data?.progressMode || "all",
        history: data?.history || {},
        reviews: data?.reviews || {},
      };
      setHistory(parsed.history);
      setReviews(parsed.reviews);
      setProgressIndex(parsed.progressIndex);
      setProgressMode(parsed.progressMode);
      console.log("[Sync] データ受信", { progressIndex: parsed.progressIndex, progressMode: parsed.progressMode });

      // 【ガードレール】初回ロード判定 かつ 画面がダッシュボードのときのみ途中再開モーダルをトリガー。
      // これによりクイズ解答中のonSnapshot受信で再開ダイアログが誤って割り込むのを完全に防ぐ。
      if (allowResumeTrigger && isFirstLoad.current && screenRef.current === "dashboard") {
        isFirstLoad.current = false;
        if (parsed.progressIndex > 0) {
          setPendingProgress(parsed);
          setShowResumeModal(true);
          console.log("[Resume] 途中再開モーダルを表示", parsed.progressIndex);
        }
      }
    };

    if (db && auth?.currentUser) {
      const docRef = doc(db, "artifacts", APP_ID, "users", userId);
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          try {
            const data = snapshot.exists() ? snapshot.data() : {};
            applyData(data, true);
          } catch (e) {
            console.warn("[Sync] スナップショット処理エラー。フォールバックします。", e);
            applyData(loadLocal(userId) || {}, true);
          }
        },
        (err) => {
          console.warn("[Sync] onSnapshotエラー。LocalStorageで継続します。", err);
          applyData(loadLocal(userId) || {}, true);
        }
      );
      return () => unsubscribe();
    } else {
      // Firestore未使用：LocalStorageから一度だけ読み込み
      applyData(loadLocal(userId) || {}, true);
    }
  }, [userId]);

  // --- 永続化（Firestore + LocalStorage 両方へ） ---
  const persist = useCallback(
    async (next) => {
      if (!userId) return;
      const merged = {
        history: next.history ?? history,
        reviews: next.reviews ?? reviews,
        progressIndex: next.progressIndex ?? progressIndex,
        progressMode: next.progressMode ?? progressMode,
        updatedAt: new Date().toISOString(),
      };
      saveLocal(userId, merged);
      if (db && auth?.currentUser) {
        try {
          const docRef = doc(db, "artifacts", APP_ID, "users", userId);
          await setDoc(docRef, merged, { merge: true });
          console.log("[Save] Firestoreへ保存", { progressIndex: merged.progressIndex, progressMode: merged.progressMode });
        } catch (e) {
          console.warn("[Save] Firestore保存失敗。LocalStorageのみ保持します。", e);
        }
      }
    },
    [userId, history, reviews, progressIndex, progressMode]
  );

  // --- 合言葉ログイン（Firestoreからの復元完了をもってログイン完了とする） ---
  const handleLogin = (e) => {
    e?.preventDefault();
    const id = inputId.trim();
    if (!id) return;
    setUserId(id);
    setScreen("dashboard");
    console.log("[Login] 合言葉でログイン:", id);
  };

  // --- モードに応じた問題リストを構築 ---
  const buildList = useCallback(
    (m, hist, rev) => {
      const h = hist ?? history;
      const r = rev ?? reviews;
      if (m === "wrong") {
        return QUESTIONS.filter((q) => h?.[q.id] && h[q.id].correct === false);
      }
      if (m === "review") {
        return QUESTIONS.filter((q) => r?.[q.id] === true);
      }
      return QUESTIONS;
    },
    [history, reviews]
  );

  // --- クイズ開始 ---
  const startQuiz = (m, startIndex = 0) => {
    const list = buildList(m);
    if (list.length === 0) {
      alert(
        m === "wrong"
          ? "前回不正解の問題はありません。"
          : m === "review"
          ? "要復習に登録された問題はありません。"
          : "問題がありません。"
      );
      return;
    }
    const safeIndex = Math.min(startIndex, list.length - 1);
    setMode(m);
    setQuizList(list);
    setCurrentIndex(safeIndex);
    setSelected(null);
    setIsAnswered(false);
    setScreen("quiz");
    console.log("[Quiz] 出題開始", { mode: m, startIndex: safeIndex, count: list.length });
  };

  // --- 途中再開 ---
  const handleResume = () => {
    const p = pendingProgress;
    setShowResumeModal(false);
    if (!p) return;
    console.log("[Resume] 続きから再開", { mode: p.progressMode, index: p.progressIndex });
    startQuiz(p.progressMode || "all", p.progressIndex || 0);
  };

  const handleRestart = () => {
    setShowResumeModal(false);
    setProgressIndex(0);
    persist({ progressIndex: 0 });
    console.log("[Resume] 進捗をリセットして最初から");
  };

  // --- 解答 ---
  const handleAnswer = (choiceIdx) => {
    if (isAnswered) return;
    const q = quizList[currentIndex];
    if (!q) return;
    const correct = choiceIdx === q.answer;
    setSelected(choiceIdx);
    setIsAnswered(true);

    const newHistory = {
      ...history,
      [q.id]: { correct, answeredAt: new Date().toISOString() },
    };
    setHistory(newHistory);
    // 現在の進捗位置とモードを保存（正解・不正解を問わず）
    persist({ history: newHistory, progressIndex: currentIndex, progressMode: mode });
    console.log("[Answer] 解答保存", { id: q.id, correct, progressIndex: currentIndex });
  };

  // --- 要復習トグル ---
  const toggleReview = () => {
    const q = quizList[currentIndex];
    if (!q) return;
    const cur = reviews?.[q.id] === true;
    const newReviews = { ...reviews, [q.id]: !cur };
    if (!newReviews[q.id]) delete newReviews[q.id];
    setReviews(newReviews);
    persist({ reviews: newReviews });
    console.log("[Review] 要復習トグル", { id: q.id, value: !cur });
  };

  // --- 次の問題へ ---
  const handleNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= quizList.length) {
      // 全問完走 → progressIndex を 0 にリセット
      setProgressIndex(0);
      persist({ progressIndex: 0 });
      setScreen("result");
      console.log("[Quiz] 全問完走。progressIndexを0にリセット");
      return;
    }
    setCurrentIndex(nextIdx);
    setSelected(null);
    setIsAnswered(false);
    persist({ progressIndex: nextIdx, progressMode: mode });
    console.log("[Quiz] 次の問題へ", nextIdx);
  };

  // --- ホームに戻る（その時点の進捗を即書き込み） ---
  const goHome = () => {
    if (screen === "quiz") {
      persist({ progressIndex: currentIndex, progressMode: mode });
      console.log("[Nav] ホームへ。進捗を保存", currentIndex);
    }
    setSelected(null);
    setIsAnswered(false);
    setScreen("dashboard");
  };

  // ===== レンダリング =====

  // 初期ローディング（Auth完了まで真っ白を防ぐ）
  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <RefreshCw className="animate-spin text-indigo-400 mb-4" size={40} />
        <p className="text-sm tracking-wide">Loading...</p>
      </div>
    );
  }

  // 【厳格な分離】合言葉ログインが完了するまではダッシュボード等を一切描画しない
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {screen === "login" && (
          <LoginScreen inputId={inputId} setInputId={setInputId} onSubmit={handleLogin} />
        )}

        {screen === "dashboard" && (
          <Dashboard
            userId={userId}
            history={history}
            reviews={reviews}
            onStart={startQuiz}
            onLogout={() => {
              setUserId("");
              setHistory({});
              setReviews({});
              setProgressIndex(0);
              setScreen("login");
            }}
          />
        )}

        {screen === "quiz" && quizList[currentIndex] && (
          <QuizScreen
            q={quizList[currentIndex]}
            index={currentIndex}
            total={quizList.length}
            selected={selected}
            isAnswered={isAnswered}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onHome={goHome}
            isReview={reviews?.[quizList[currentIndex].id] === true}
            onToggleReview={toggleReview}
          />
        )}

        {screen === "result" && (
          <ResultScreen
            quizList={quizList}
            history={history}
            onHome={goHome}
            onRetry={() => startQuiz(mode, 0)}
          />
        )}
      </div>

      {/* 途中再開モーダル */}
      {showResumeModal && pendingProgress && (
        <ResumeModal
          progress={pendingProgress}
          onResume={handleResume}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

// ===================================================================
// 画面：ログイン（合言葉）
// ===================================================================
function LoginScreen({ inputId, setInputId, onSubmit }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-lg shadow-indigo-900/40">
            <BookOpen className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
          <p className="mt-1 text-sm text-indigo-300">{SOURCE_LABEL}</p>
        </div>

        <form onSubmit={onSubmit}>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <User size={16} /> 合言葉（ユーザーID）
          </label>
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="例: my-study-key-2026"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
          <p className="mt-2 text-xs text-slate-500">
            同じ合言葉を入力すれば、PCとスマホで学習履歴・進捗が同期されます。
          </p>
          <button
            type="submit"
            disabled={!inputId.trim()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01] hover:shadow-indigo-700/50 disabled:opacity-40 disabled:hover:scale-100"
          >
            学習を始める <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ===================================================================
// 画面：ダッシュボード
// ===================================================================
function Dashboard({ userId, history, reviews, onStart, onLogout }) {
  const answered = QUESTIONS.filter((q) => history?.[q.id]).length;
  const correct = QUESTIONS.filter((q) => history?.[q.id]?.correct === true).length;
  const wrong = QUESTIONS.filter((q) => history?.[q.id]?.correct === false).length;
  const reviewCount = QUESTIONS.filter((q) => reviews?.[q.id] === true).length;

  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const progressRate = Math.round((answered / TOTAL) * 100);
  const correctRate = Math.round((correct / TOTAL) * 100);

  const catProgress = (cat) => {
    const list = QUESTIONS.filter((q) => q.category === cat);
    const done = list.filter((q) => history?.[q.id]).length;
    return list.length ? Math.round((done / list.length) * 100) : 0;
  };

  // レーダーチャート：モック準拠の5指標を動的に算出
  const radarData = [
    { metric: "総合進捗率", value: progressRate },
    { metric: "全問正解率", value: correctRate },
    { metric: "回答正確性", value: accuracy },
    { metric: "開発手法・管理", value: catProgress("process") },
    { metric: "設計・テスト技法", value: catProgress("design") },
  ];

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">{APP_TITLE}</h1>
          <p className="text-xs text-indigo-300">{SOURCE_LABEL}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-600"
        >
          <User size={14} /> {userId}
        </button>
      </div>

      {/* 統計カード */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="進捗" value={`${answered}/${TOTAL}`} accent="indigo" />
        <StatCard label="正答率" value={`${accuracy}%`} accent="sky" />
        <StatCard label="不正解" value={wrong} accent="rose" />
        <StatCard label="要復習" value={reviewCount} accent="amber" />
      </div>

      {/* レーダーチャート（5指標の学習バランス） */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-200">
          <BarChart2 size={16} className="text-sky-400" /> 学習バランス（5指標）
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} />
              <Radar name="達成率" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.45} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* モード選択 */}
      <div className="mb-6 space-y-3">
        <ModeButton
          icon={<BookOpen size={18} />}
          title="すべての問題"
          desc={`全${TOTAL}問を順番に演習`}
          onClick={() => onStart("all", 0)}
        />
        <ModeButton
          icon={<RefreshCw size={18} />}
          title="前回不正解の問題のみ"
          desc={`${wrong}問が対象`}
          onClick={() => onStart("wrong", 0)}
          disabled={wrong === 0}
        />
        <ModeButton
          icon={<HelpCircle size={18} />}
          title="要復習の問題のみ"
          desc={`${reviewCount}問が対象`}
          onClick={() => onStart("review", 0)}
          disabled={reviewCount === 0}
        />
      </div>

      {/* 履歴一覧（グリッド俯瞰） */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
          <BarChart2 size={16} className="text-indigo-400" /> 解答状況一覧
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {QUESTIONS.map((q) => {
            const h = history?.[q.id];
            const st = !h ? "未着手" : h.correct ? "正解" : "不正解";
            const stColor = !h
              ? "text-slate-500 border-slate-700"
              : h.correct
              ? "text-emerald-300 border-emerald-700/50 bg-emerald-500/10"
              : "text-rose-300 border-rose-700/50 bg-rose-500/10";
            const dt = h?.answeredAt
              ? new Date(h.answeredAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "-";
            return (
              <div
                key={q.id}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
              >
                <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">{q.id}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{q.title}</p>
                  <p className="truncate text-[10px] text-slate-500">{CAT_LABEL[q.category]}・{q.source}</p>
                </div>
                {reviews?.[q.id] && (
                  <span className="shrink-0 rounded border border-amber-600/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">復習</span>
                )}
                <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${stColor}`}>{st}</span>
                <span className="hidden shrink-0 text-[10px] text-slate-500 sm:block">{dt}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const colors = {
    indigo: "from-indigo-600/20 to-indigo-500/5 border-indigo-700/40 text-indigo-200",
    sky: "from-sky-600/20 to-sky-500/5 border-sky-700/40 text-sky-200",
    rose: "from-rose-600/20 to-rose-500/5 border-rose-700/40 text-rose-200",
    amber: "from-amber-600/20 to-amber-500/5 border-amber-700/40 text-amber-200",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-3 ${colors[accent]}`}>
      <p className="text-[11px] opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ModeButton({ icon, title, desc, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4 text-left transition hover:scale-[1.01] hover:border-indigo-600/60 hover:shadow-lg hover:shadow-indigo-900/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:border-slate-800"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-md">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-bold text-white">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <ChevronRight className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-indigo-400" size={20} />
    </button>
  );
}

// ===================================================================
// 画面：出題・解答・解説
// ===================================================================
function QuizScreen({ q, index, total, selected, isAnswered, onAnswer, onNext, onHome, isReview, onToggleReview }) {
  const correct = isAnswered && selected === q.answer;

  return (
    <div>
      {/* 上部バー */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onHome}
          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-600"
        >
          <Home size={14} /> ホーム
        </button>
        <span className="text-xs text-slate-400">
          {index + 1} / {total} 問
        </span>
      </div>

      {/* 進捗バー */}
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* 問題カード */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 px-2.5 py-1 text-[11px] font-bold text-white">
            出典：{q.source}
          </span>
          {q.source !== SECTION_BADGE && (
            <span className="rounded-lg border border-sky-600/50 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-200">
              {SECTION_BADGE}
            </span>
          )}
          <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300">
            問題 {q.id}：{q.title}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{q.question}</p>

        {/* 問題画面の図表（解答漏洩しない与条件のみ） */}
        {renderFigures(q.id, "problem")}

        {/* 選択肢 */}
        <div className="mt-4 space-y-2.5">
          {q.choices.map((c, i) => {
            let cls =
              "border-slate-700 bg-slate-950/60 hover:border-indigo-600/60 hover:bg-slate-900";
            if (isAnswered) {
              if (i === q.answer) {
                cls = "border-emerald-500/70 bg-emerald-500/10";
              } else if (i === selected) {
                cls = "border-rose-500/70 bg-rose-500/10";
              } else {
                cls = "border-slate-800 bg-slate-950/40 opacity-60";
              }
            }
            return (
              <button
                key={i}
                onClick={() => onAnswer(i)}
                disabled={isAnswered}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${cls} ${
                  !isAnswered ? "hover:scale-[1.005]" : "cursor-default"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isAnswered && i === q.answer
                      ? "bg-emerald-500 text-white"
                      : isAnswered && i === selected
                      ? "bg-rose-500 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {CHOICE_LABELS[i]}
                </span>
                <span className="flex-1 text-slate-100">{c}</span>
                {isAnswered && i === q.answer && <Check size={18} className="mt-0.5 shrink-0 text-emerald-400" />}
                {isAnswered && i === selected && i !== q.answer && <X size={18} className="mt-0.5 shrink-0 text-rose-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 解説エリア */}
      {isAnswered && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
          <div
            className={`mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              correct
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {correct ? <Check size={18} /> : <X size={18} />}
            {correct ? "正解！" : "不正解"}
            <span className="ml-auto text-slate-300">
              正解：{CHOICE_LABELS[q.answer]}
            </span>
          </div>

          {/* 要復習チェック */}
          <label className="mb-4 flex cursor-pointer select-none items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-600/50">
            <input
              type="checkbox"
              checked={isReview}
              onChange={onToggleReview}
              className="h-4 w-4 accent-amber-500"
            />
            <HelpCircle size={16} className="text-amber-400" />
            要復習リストに登録する
          </label>

          {/* 解説用の図表（解答後にのみ表示） */}
          {renderFigures(q.id, "explanation")}

          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-300">
            <BookOpen size={16} /> 解説
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{q.explanation}</p>

          {/* ここが重要（解説レジュメ） */}
          {q.koko && (
            <div className="mt-5 rounded-xl border border-indigo-700/40 bg-indigo-500/5 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-300">
                <HelpCircle size={16} /> ここが重要
              </h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{q.koko}</p>
            </div>
          )}

          <button
            onClick={onNext}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
          >
            {index + 1 >= total ? "結果を見る" : "次の問題へ"} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ===================================================================
// 画面：結果
// ===================================================================
function ResultScreen({ quizList, history, onHome, onRetry }) {
  const total = quizList.length;
  const correct = quizList.filter((q) => history?.[q.id]?.correct === true).length;
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-lg">
          <Check className="text-white" size={32} />
        </div>
        <h1 className="text-xl font-bold text-white">演習完了！</h1>
        <p className="mt-1 text-sm text-slate-400">お疲れさまでした。</p>

        <div className="my-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <p className="text-sm text-slate-400">正答数</p>
          <p className="mt-1 text-4xl font-bold text-white">
            {correct}
            <span className="text-lg text-slate-500"> / {total}</span>
          </p>
          <p className="mt-2 text-2xl font-bold text-sky-300">{rate}%</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01]"
          >
            <RefreshCw size={16} /> もう一度挑戦する
          </button>
          <button
            onClick={onHome}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-600"
          >
            <Home size={16} /> ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// 途中再開モーダル
// ===================================================================
function ResumeModal({ progress, onResume, onRestart }) {
  const modeLabel =
    progress.progressMode === "wrong"
      ? "前回不正解"
      : progress.progressMode === "review"
      ? "要復習"
      : "すべての問題";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500">
          <RefreshCw className="text-white" size={24} />
        </div>
        <h2 className="text-center text-lg font-bold text-white">中断した続きがあります</h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">
          前回は【問題{(progress.progressIndex || 0) + 1}】まで進んでいます。
          <br />
          中断したモード（<span className="font-bold text-sky-300">{modeLabel}</span>モード）の続きから再開しますか？
        </p>
        <div className="mt-6 space-y-3">
          <button
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01]"
          >
            続きから再開する <ArrowRight size={16} />
          </button>
          <button
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-600"
          >
            最初から始める
          </button>
        </div>
      </div>
    </div>
  );
}