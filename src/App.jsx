// npm install lucide-react recharts firebase

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Check, X, Home, ChevronRight, AlertCircle, Save, RotateCcw, Play, List, CheckSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// ==========================================
// 1. Firebase Configuration & App Settings
// ==========================================
// TODO: 以下のダミー値を本番環境のFirebase設定に書き換えてください。
const firebaseConfig = {
  apiKey: "AIzaSyCyo4bAZwqaN2V0g91DehS6mHmjZD5XJTc",
  authDomain: "sabu-hide-web-app.firebaseapp.com",
  projectId: "sabu-hide-web-app",
  storageBucket: "sabu-hide-web-app.firebasestorage.app",
  messagingSenderId: "145944786114",
  appId: "1:145944786114:web:0da0c2d87a9e24ca6cf75b",
  measurementId: "G-XSS72H1ZKV"
};

// Firebase初期化 (try-catchでエラー回避)
let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// アプリケーションごとに一意のIDを設定（他の問題集と混ざらないようにするため）
const APP_ID = "financial-quiz-4-6";

// ==========================================
// 2. Quiz Data (全16問完全収録)
// ==========================================
const quizData = [
  {
    id: 1,
    title: "情報システム開発の流れ",
    question: "情報システムの開発プロセスに関して、次のa～cの順序として、最も適切なものを下記の解答群から選べ。\n\na　情報システム導入に必要な要員や費用の見積り\nb　プログラムの機能や処理内容の設計\nc　ユーザ・インターフェースの設計",
    options: ["a → b → c", "a → c → b", "b → c → a", "c → a → b"],
    answerIndex: 1,
    explanation: {
      summary: "本問では情報システムの開発プロセスについて問われています。\n情報システム開発の基本的な流れは、 基本計画、設計、開発、テスト、運用･保守の手順 となります。",
      details: "正解：イ　a → c → b\n\naの「情報システム導入に必要な要員や費用の見積り」は、情報システムの開発プロセスの「基本計画」で行われます。bの「プログラムの機能や処理内容の設計」は、プログラム内部の仕様を設計することですから、「内部設計」で行われます。cの「ユーザ・インターフェースの設計」は、「外部設計」で行われます。なお、「外部設計」では、データベースの設計なども含まれます。基本的な流れとしては、外部設計→内部設計の順に行われますので、a→c→bの順序で実施されます。",
      table: [
        { title: "基本計画", desc: "情報システムの基本的な計画を作成する段階であり、情報システムを企画する工程です。情報システムの要件を明確にする 要件定義 などを行います。" },
        { title: "設計", desc: "設計では、基本計画で定義した要件に基づき、情報システムの機能を設計します。設計は、「 外部設計 」と「 内部設計 」に分けられます。外部設計では、利用者から見た仕様を設計します。内部設計では、プログラムの内部の仕様を設計します。" },
        { title: "開発", desc: "設計で作成した各種の設計書を基に、データベースや各種のプログラムなどを開発していきます。" },
        { title: "テスト", desc: "開発で作成したプログラムなどが、仕様どおりに動作するかをテストします。" },
        { title: "運用・保守", desc: "定期的なバックアップ、利用者からの問合せ対応などを行います。" }
      ]
    }
  },
  {
    id: 2,
    title: "情報システムの開発手法",
    question: "情報システムの開発手法に関する記述として、最も適切なものはどれか。",
    options: [
      "ウォーターフォール型のシステム開発では、システムの機能や構造を決める内部設計が行われた後に、ユーザ・インターフェースなどを決める外部設計が行われる。",
      "RADは、ウォーターフォール型のシステム開発プロセスを、より短期間で実施できることを目的とした手法である。",
      "スパイラル型のシステム開発では、システムの部分単位に開発プロセスを繰り返しながら、徐々にシステムの完成度を高めていく。",
      "プロトタイピングでは、プロトタイプが問題ないことをユーザに確認してもらえば、その後に開発する本格的なシステムは問題なく稼働する。"
    ],
    answerIndex: 2,
    explanation: {
      summary: "本問では情報システムの開発手法について問われています。\n情報システムの開発手法を、開発の手順で大きく分類すると、ウォーターフォール型、プロトタイプ型、スパイラル型の開発手法があります。",
      details: "正解：ウ\n\nア ×：ウォーターフォール型では、外部設計を行ってから、内部設計が行われます。\nイ ×：RAD（Rapid Application Development）は、プロトタイプ型と同じく試作品を作って開発を進める手法です。プロトタイプを完成イメージに近付けるため、製作と評価を繰り返しながら開発が進められます。\nウ ○：スパイラル型の説明に関する、正しい記述です。\nエ ×：プロトタイピング（プロトタイプ型）は、プロトタイプが問題ないことをユーザに確認してもらいますが、その後に本格的なシステムを開発するプロセスではテストを行います。",
      customRender: () => (
        <div className="mt-4 space-y-4 text-sm">
          <div className="border p-2 bg-blue-50">
            <strong>ウォーターフォール型:</strong> 上流工程から順番に実施していく方法です。<br/>
            <span className="text-gray-600">基本計画 → 外部設計 → 内部設計 → 開発 → テスト → 運用保守</span>
          </div>
          <div className="border p-2 bg-orange-50">
            <strong>プロトタイプ型:</strong> プロジェクトの早い段階でプロトタイプ（試作品）を作成し、ユーザが確認してから本格的に開発する方法です。
          </div>
          <div className="border p-2 bg-green-50">
            <strong>スパイラル型:</strong> 設計、開発、テストという手順を何度もくり返すことで、徐々にシステムを成長させていく開発手法です。
          </div>
        </div>
      )
    }
  },
  {
    id: 3,
    title: "PMBOK",
    question: "プロジェクト管理の知識体系であるPMBOK（第７版まで）に関する記述として、最も不適切なものはどれか。",
    options: [
      "PMBOKは、情報システム以外のプロジェクトにも対応している。",
      "PMBOKでは、プロジェクトマネジメントの12の原理・原則、プロジェクトマネジメントの10の知識エリアが定義されている。",
      "PMBOKは、米国プロジェクトマネジメント協会（PMI）が策定・改定している。",
      "WBSは、成果物を得るために必要な工程や作業について記述する。"
    ],
    answerIndex: 1,
    explanation: {
      summary: "本問ではPMBOKについて問われています。\nPMBOK （Project Management Body of Knowledge）は、プロジェクト管理の方法を体系的にまとめたものであり、プロジェクト管理の知識に関する国際標準と位置づけられます。",
      details: "正解：イ\n\nア ○：PMBOKは、情報システムに限らず、プロジェクトマネジメントの遂行に必要な基本的な知識を汎用的な形で体系立てて整理したものです。\nイ ×：PMBOK第7版では、「10の知識エリア」という概念がなくなり、「8のパフォーマンス・ドメイン」という概念が登場しました。\nウ ○：米国プロジェクトマネジメント協会（PMI）では、PMBOKに準拠した国際的な認定制度「PMP」(Project Management Professional)を展開しています。\nエ ○：PMBOKのスコープマネジメントにて、WBSが取り上げられています。WBS（Work Breakdown Structure）とは、プロジェクトの全ての作業を階層構造で表したものです。",
      customRender: () => (
        <div className="mt-4 border p-3 bg-gray-50 text-sm">
          <strong>PMBOK第7版の8つのパフォーマンス・ドメイン:</strong><br/>
          ステークホルダー / チーム / 開発アプローチとライフサイクル / 計画 / プロジェクト作業 / デリバリー / パフォーマンスの測定 / 不確実性
        </div>
      )
    }
  },
  {
    id: 4,
    title: "EVMS",
    question: "システム開発プロジェクトの管理に使われるEVMSに関する記述として、最も不適切なものはどれか。",
    options: [
      "EVMSでは、プロジェクトの全ての作業を金銭価値に置きなおし、プロジェクトの進捗において、作業の進捗度を金額で表現することで管理する。",
      "EVMSを用いると、進捗状況が明確になるが、計画変更の管理が煩雑になりやすいという問題がある。",
      "EVMSでは、アーンドバリューとベースラインを比較することで、進捗度合いを定量的に把握する。",
      "EVMSは、小規模なプロジェクトでの適用には向いているが、大規模プロジェクトには向かない。"
    ],
    answerIndex: 3,
    explanation: {
      summary: "本問ではEVMSについて問われています。\nEVMS （Earned Value Management System：出来高管理システム）とは、プロジェクトの進捗管理をする方法であり、作業の進捗度を金額で表現することで管理します。",
      details: "正解：エ\n\nア ○：EVMSは、作業の工数を金額に換算する点が特徴です。\nイ ○：進捗状況を定量的に把握できますが、計画変更があった場合、再度金額に換算する必要があるため管理は煩雑になります。\nウ ○：アーンドバリューとは作業の進捗を金額で表したもの、ベースラインとは作業の見積もりを金額に換算して計算したものです。\nエ ×：EVMSは厳密に管理できる一方で、管理のための手間がかかることから、小規模プロジェクトよりもむしろ大規模プロジェクトに向いています。"
    }
  },
  {
    id: 5,
    title: "要件定義",
    question: "情報システムの要件定義に関する記述として、最も不適切なものはどれか。",
    options: [
      "要件定義では、システムの仕様およびシステム化の範囲と機能を明確にし、利害関係者間で合意する。",
      "数値化していない要件は、それを満たしているか否かの判断基準が人によって異なるため、数値化すべきである。",
      "要件は漏れなく明確化する必要があるため、未確定な部分があるときは決定を先送りすべきである。",
      "要件定義では、システム利用者のニーズの整理を行う。"
    ],
    answerIndex: 2,
    explanation: {
      summary: "本問では情報システムの要件定義について問われています。\n要件定義は、情報システム開発の最初の工程である「基本計画」にて行われます。",
      details: "正解：ウ\n\nア ○：情報システムの開発における業務要件を定義する目的を表しています。\nイ ○：数値化できるものは極力、数値化します。「速やかに」ではなく「1時間以内に復旧」のようにし、単位も明確にします。\nウ ×：要件は次の工程のインプットになるため、漏れなく明確化する必要がありますが、未確定な部分があるときは先送りすることなく、対象範囲として含めるもしくは含めないなど決定すべきです。\nエ ○：ユーザーヒアリングなどによりシステム利用者のニーズを整理し、改善点や要件を洗い出します。"
    }
  },
  {
    id: 6,
    title: "RFPとRFI",
    question: "ユーザ企業がITベンダーに提出する文書に関する記述として、最も適切なものはどれか。",
    options: [
      "RFIとは、システムが提供するサービスの品質保証やペナルティに関する契約内容を明らかにし、ITベンダーと合意する文書をいう。",
      "SLAとは、発注先候補のITベンダーに情報提供を依頼する文書をいう。",
      "RFPとは、ITベンダーからの提案を評価・検討し、システム開発を依頼する文書をいう。",
      "RFPとは、システムの概要や主要な機能などに関する提案を依頼する文書をいう。"
    ],
    answerIndex: 3,
    explanation: {
      summary: "本問では、ユーザ企業がITベンダーに提出する文書の種類について問われています。",
      details: "正解：エ\n\nア ×：記述の内容は「SLA」の説明です。RFIは情報提供依頼書です。\nイ ×：記述の内容は「RFI」の説明です。SLAはサービスレベル合意書です。\nウ ×：記述の内容はシステム開発の「発注書」の説明です。\nエ ○：正しい記述です。RFP(Request For Proposal) は、システム開発の発注に先立ち、システムの概要や主要な機能などに関する提案を依頼する文書です。"
    }
  },
  {
    id: 7,
    title: "工数と費用の見積り",
    question: "情報システム開発の工数と費用の見積りに関する次の文中の空欄Ａ～Ｃに入る語句の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\n情報システムの開発工数を見積る手法の1つとして、システムの持つ機能をもとに、機能ごとの複雑さなどから（　Ａ　）という点数をつけて評価する方法がある。\nこの方法では、まずシステムの機能を洗い出し、機能のタイプごとに機能の数を数えます。次に、機能ごとに複雑さを評価し、（ Ｂ　）段階のタイプに分けます。さらに、各タイプ別の係数を掛けて（　Ａ　）を計算します。\nこれは、詳細なプログラムなどの設計の（　Ｃ　）に行われます。",
    options: [
      "Ａ：ファンクションポイント　Ｂ：3　Ｃ：前",
      "Ａ：スコアリングモデル　Ｂ：4　Ｃ：前",
      "Ａ：ファンクションポイント　Ｂ：4　Ｃ：後",
      "Ａ：スコアリングモデル Ｂ：3　Ｃ：後"
    ],
    answerIndex: 0,
    explanation: {
      summary: "本問ではファンクションポイント法について問われています。\nファンクションポイント法は、機能ごとの複雑さによって点数を付け、その点数を合計することによって工数を見積る方法です。",
      details: "正解：ア\n\nA：ファンクションポイント\n（スコアリングモデルは定性的な評価項目を定量化する方法です）\nB：3\n（機能ごとに複雑さを評価して、「簡単」「普通」「複雑」の3段階に分けます）\nC：前\n（開発工数の見積もりは、詳細なプログラムを設計する前の「基本設計」プロセスにて行われます）",
      customRender: () => (
        <div className="mt-4 overflow-x-auto text-sm">
          <table className="min-w-full border-collapse border border-gray-400 bg-white">
            <thead className="bg-orange-100">
              <tr>
                <th className="border border-gray-400 px-4 py-2 text-left">タイプ</th>
                <th className="border border-gray-400 px-4 py-2">簡単</th>
                <th className="border border-gray-400 px-4 py-2">普通</th>
                <th className="border border-gray-400 px-4 py-2">複雑</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-400 px-4 py-2">外部入力 (入力画面など)</td><td className="border border-gray-400 px-4 py-2 text-center">3 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">4 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">6 × 数</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2">外部出力 (帳票など)</td><td className="border border-gray-400 px-4 py-2 text-center">4 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">5 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">7 × 数</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2">外部照会 (照会画面など)</td><td className="border border-gray-400 px-4 py-2 text-center">3 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">4 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">6 × 数</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2">内部論理ファイル (DB等)</td><td className="border border-gray-400 px-4 py-2 text-center">7 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">10 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">15 × 数</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2">外部インターフェイス</td><td className="border border-gray-400 px-4 py-2 text-center">5 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">7 × 数</td><td className="border border-gray-400 px-4 py-2 text-center">10 × 数</td></tr>
            </tbody>
          </table>
        </div>
      )
    }
  },
  {
    id: 8,
    title: "UML",
    question: "業務システムの分析・設計に用いられるUMLに関する記述として、最も適切なものはどれか。",
    options: [
      "UMLは、オブジェクト指向によるシステム開発の方法論である。",
      "UMLにて、設計図をどのような順序で用いるかは、UML標準で決められている。",
      "ネットワーク図は、オブジェクト間の処理プロセスを表現するUMLのダイアグラムの1つである。",
      "ユースケース図は、システムにどのような利用者がいるか、その利用者がどのような操作をするかを表すUMLのダイアグラムの１つである。"
    ],
    answerIndex: 3,
    explanation: {
      summary: "本問ではUMLについて問われています。\nUMLは、オブジェクト指向アプローチのシステム開発における、設計図の統一表記法です。",
      details: "正解：エ\n\nア ×：UMLは表記法であり、方法論は含まれていません。\nイ ×：どの設計書をどういう順序で使うかは定められていません。\nウ ×：オブジェクト間の処理プロセスを表すのは「シーケンス図」です。ネットワーク図はUMLにはありません。\nエ ○：正しい記述です。ユースケース図では、機能をユースケースで表し、機能を利用する人や外部システムをアクターで表して関係を表現します。",
      table: [
        { title: "ユースケース図", desc: "要件定義などの上流工程で、業務の機能を表現するために使われる" },
        { title: "クラス図", desc: "オブジェクトの「型」を定義する" },
        { title: "シーケンス図", desc: "オブジェクト間の処理プロセスを表す" }
      ]
    }
  },
  {
    id: 9,
    title: "情報システムの設計1",
    question: "情報システムの設計に関する記述として、最も適切なものはどれか。",
    options: [
      "DFDは、プロセス指向アプローチで用いられ、データの流れと時間的情報を記述する手法である。",
      "ER図は、データ指向アプローチで用いられる図表であり、データ間の関連を描画する。",
      "STDは、オブジェクト指向アプローチで用いられる、モデリング言語の１つである。",
      "DOAでは、システム開発後のデータ構造の変更が必要な際、一部のプログラムへの影響で抑えられやすい。"
    ],
    answerIndex: 1,
    explanation: {
      summary: "本問では情報システムの設計について問われています。\n情報システムの設計アプローチには、POA(プロセス指向)、DOA(データ指向)、OOA(オブジェクト指向)があります。",
      details: "正解：イ\n\nア ×：DFDはデータと処理の流れを記述しますが、時間的情報については記述されません。\nイ ○：正しい記述です。ER図はERDとも呼ばれます。\nウ ×：STD(状態遷移図)はオブジェクト指向特有のものではありません。オブジェクト指向で用いられるのはUMLです。\nエ ×：DOAではデータ構造を変更する場合、関連するプログラムを全て変更する必要があります。"
    }
  },
  {
    id: 10,
    title: "情報システムの設計2",
    question: "情報システムの設計に用いられる下記の図（※担当者から注文プロセスへ、注文プロセスから商品ファイルと在庫確認プロセスへデータの流れがある図）に関する説明として、最も適切なものを下記の解答群の中から選べ。",
    options: [
      "データベースをどのように構築したらいいかを示すERDである。",
      "業務とデータの処理の関係を記述したDFDである。",
      "データと処理をセットにしたクラス図である。",
      "図中の「商品ファイル」や「在庫ファイル」は、データマートと呼ばれる。"
    ],
    answerIndex: 1,
    explanation: {
      summary: "本問では情報システムの設計で用いられる図表について問われています。\n問題文で示されている図は、プロセス(丸)とデータストア(二重線)、データの流れ(矢印)から構成されるDFD（データフローダイアグラム）です。",
      details: "正解：イ\n\nア ×：図はDFDです。ERDはエンティティとリレーションで表されます。\nイ ○：正しい記述です。POAで用いられるDFDです。\nウ ×：図はDFDです。クラス図はデータと手続きをセットにした矩形で表されます。\nエ ×：図中の「商品ファイル」は「データストア」です。データマートはDWHから抽出された目的別データベースのことです。"
    }
  },
  {
    id: 11,
    title: "XP（エクストリーム･プログラミング）",
    question: "XP（エクストリーム･プログラミング）に関する記述として、最も不適切なものはどれか。",
    options: [
      "XPはアジャイル開発の手法の１つであり、小規模なシステムの開発に向いている。",
      "XPでは、設計・開発・テストを繰り返して、システム開発を進めていく。",
      "XPのプラクティスとして、ビジュアルプログラミングが定められている。",
      "XPでは、原理とすべき価値と具体的なプラクティスが定められている。"
    ],
    answerIndex: 2,
    explanation: {
      summary: "本問ではXP（エクストリーム･プログラミング）について問われています。\n迅速にプログラムを開発するアジャイル開発プロセスの具体的な手法の1つです。",
      details: "正解：ウ\n\nア ○：XPを含め、アジャイル開発は比較的小規模なシステムの開発に向いています。\nイ ○：イテレーションのサイクルを継続して行い、各イテレーションの中で設計、開発、テストを行います。\nウ ×：XPに「ビジュアルプログラミング」というプラクティスは含まれていません。代表的なプラクティスは「ペアプログラミング」などです。\nエ ○：XPでは「コミュニケーション」「シンプル」「フィードバック」「勇気」「尊重」という価値と、それに基づくプラクティスが定められています。"
    }
  },
  {
    id: 12,
    title: "RAD（Rapid Application Development）",
    question: "RAD（Rapid Application Development）に関する記述として、最も適切なものはどれか。",
    options: [
      "RADは、比較的長期間のプロジェクトに適用される開発手法である。",
      "RADでは、開発サイクルを繰り返すことによって、システムの完成度を高めていく。",
      "RADでは、エンジニアだけでなく、エンドユーザも含めたチームでプロジェクトを進める。",
      "RADで用いられるCASEツールは、コーディングやテスト工程の生産を高めるためのものであり、設計工程は対象としていない。"
    ],
    answerIndex: 2,
    explanation: {
      summary: "本問ではRAD（Rapid Application Development）について問われています。\nRADは、プロトタイプと呼ばれるシステムの完成イメージを何度も制作、評価し、次第に完成品に近づけてゆく手法です。",
      details: "正解：ウ\n\nア ×：RADは、小規模・短期間のプロジェクトに適用される手法です。\nイ ×：開発サイクルを繰り返して完成度を高めるのは「スパイラルモデル」です。\nウ ○：正しい記述です。エンドユーザを含む少人数のチームで担当し、開発期間を短縮します。\nエ ×：CASEツールには設計など上流工程を支援する「上流CASEツール」も存在します。"
    }
  },
  {
    id: 13,
    title: "システムテスト",
    question: "システムテスト（総合テスト）に関する記述として、最も適切なものはどれか。",
    options: [
      "システムテストでは、想定される最大業務負荷に耐えられるかどうかの確認が行われる。",
      "システムテストでは、主にモジュールやプログラム間のインターフェースや相互の関連性を検証する。",
      "システムテストでは、適正なデータを用いてテストを行い、例外処理は対象としなくてよい。",
      "システムテストは、利用ユーザが中心となって行う。"
    ],
    answerIndex: 0,
    explanation: {
      summary: "本問では情報システムのテストについて問われています。\nテストは、単体テスト、結合テスト、システムテスト、検収テストの順で行われます。",
      details: "正解：ア\n\nア ○：システムテストではシステム全体の性能のテストも行われ、最大業務負荷に耐えられるかの確認(負荷テスト/性能テスト)が行われます。\nイ ×：モジュール間の関連性を検証するのは「結合テスト」です。\nウ ×：正常な処理だけでなく、例外処理についてもテストを行います(例外テスト)。\nエ ×：システムテストは情報システム部門や開発側が中心です。利用ユーザが中心に行うのは「検収テスト(受入テスト)」です。"
    }
  },
  {
    id: 14,
    title: "ウォークスルー",
    question: "ソフトウェア品質レビュー技法のうち、ウォークスルーに関する記述として、最も適切なものはどれか。",
    options: [
      "プログラム作成者、進行まとめ役、記録役、説明役、レビュー役を明確に決めて、厳格なレビューを公式に行う。",
      "プログラムを動作させて行う動的テストの１つである。",
      "システム開発者が集まって実施され、プロジェクト責任者は参加が必須である。",
      "システム開発の早い時期で、欠陥を発見するために行われる。"
    ],
    answerIndex: 3,
    explanation: {
      summary: "本問ではウォークスルーについて問われています。\nウォークスルーは、ソフトウェア開発の各工程の成果物について、問題点が無いかを集団で検証する作業です。",
      details: "正解：エ\n\nア ×：これは「インスペクション」に関する記述です。ウォークスルーは公式なレビューではありません。\nイ ×：ウォークスルーやインスペクションはプログラムの動作を伴わない「静的テスト」です。\nウ ×：ウォークスルーは開発者が集まって実施しますが、プロジェクト責任者の参加は必須ではありません(インフォーマル)。\nエ ○：正しい記述です。ソフトウェアが完成する前の工程で、問題点を発見して早期に欠陥を除去するために行われます。"
    }
  },
  {
    id: 15,
    title: "ホワイトボックステスト、ブラックボックステスト",
    question: "ホワイトボックステストやブラックボックステストに関する記述として、最も適切なものはどれか。",
    options: [
      "ホワイトボックステストでは、分岐命令やモジュールの数が増えると、テストデータが急増する。",
      "ブラックボックステストでは、テストデータの作成基準として、命令や分岐の網羅率を使用する。",
      "ホワイトボックステストでは、プログラムの入力と出力の関係に注目してテストデータを作成する。",
      "ブラックボックステストは、単体テストでのみ実施される。"
    ],
    answerIndex: 0,
    explanation: {
      summary: "本問ではホワイトボックステストとブラックボックステストについて問われています。\nホワイトボックステストは「内部構造」に注目し、ブラックボックステストは「入出力」に注目します。",
      details: "正解：ア\n\nア ○：正しい記述です。内部の分岐等が増えると、組み合わせの数が等比級数的に増加します。\nイ ×：網羅率は「ホワイトボックステスト」で用いる基準です。\nウ ×：入出力の関係に注目するのは「ブラックボックステスト」です。\nエ ×：ブラックボックステストは結合テストやシステムテスト等でも行われます。"
    }
  },
  {
    id: 16,
    title: "結合テスト",
    question: "結合テストに関する記述として、最も不適切なものはどれか。",
    options: [
      "結合テストの方法の１つにビッグバンテストがあり、複数のモジュールを一挙に結合して、その動作を検証する。",
      "ビッグバンテストでは、結合テスト全体の時間が短縮できるメリットがある一方、バグのある箇所の特定が難しく、かえって時間がかかってしまったり、バグが残りやすくなったりするなどのリスクもある。",
      "上位のモジュールから順番に結合してテストをしていく手法をトップダウンテストという。また、下位のモジュールから順番に結合してテストをしていく手法のことを、ボトムアップテストという。",
      "上位モジュールと下位モジュールを結合してテストを実施したいが上位モジュールが完成していない場合、スタブと呼ばれるダミーモジュールを作ってテストする。"
    ],
    answerIndex: 3,
    explanation: {
      summary: "本問では結合テストの種類や詳細について問われています。\nモジュールを組み合わせる結合テストには、トップダウン、ボトムアップ、ビッグバンなどの手法があります。",
      details: "正解：エ\n\nア ○：ビッグバンテストの内容として適切です。\nイ ○：ビッグバンテストの特徴として適切です。\nウ ○：トップダウンテストとボトムアップテストの概要として適切です。\nエ ×：上位モジュールが完成していない場合に使われるダミーモジュールは「ドライバ」です。「スタブ」は下位モジュールが完成していない場合に使われるダミーです。"
    }
  }
];


// ==========================================
// 3. Main Application Component
// ==========================================
export default function App() {
  // --- States ---
  const [userId, setUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('login'); // login, home, quiz, result, history
  const [userData, setUserData] = useState({
    history: {},
    review: {},
    progressIndex: 0,
    progressMode: 'all'
  });
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Quiz execution states
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState('all');
  const [sessionResults, setSessionResults] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // --- Firebase Interactions ---
  const saveUserDataToFirebase = async (dataToSave) => {
    if (!db || !userId) return;
    try {
      console.log("Saving data to Firebase...", dataToSave);
      await setDoc(doc(db, APP_ID, userId), dataToSave, { merge: true });
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const loadUserDataFromFirebase = async (id) => {
    if (!db) {
      console.warn("Firebase not initialized. Using local memory only.");
      setIsLoggedIn(true);
      return;
    }
    setIsLoading(true);
    try {
      console.log(`Loading data for user: ${id}`);
      const docSnap = await getDoc(doc(db, APP_ID, id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({
          history: data.history ?? {},
          review: data.review ?? {},
          progressIndex: data.progressIndex ?? 0,
          progressMode: data.progressMode ?? 'all'
        });
        if (data.progressIndex > 0) {
          setShowResumePrompt(true);
        }
      } else {
        // 新規ユーザー
        setUserData({ history: {}, review: {}, progressIndex: 0, progressMode: 'all' });
      }
      setIsLoggedIn(true);
      setView('home');
    } catch (error) {
      console.error("Error loading data:", error);
      alert("データの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (userId.trim().length === 0) return;
    loadUserDataFromFirebase(userId.trim());
  };

  const handleLogout = () => {
    setUserId('');
    setIsLoggedIn(false);
    setView('login');
    setUserData({ history: {}, review: {}, progressIndex: 0, progressMode: 'all' });
  };

  const buildQuestionList = (mode) => {
    let list = [];
    if (mode === 'all') {
      list = [...quizData];
    } else if (mode === 'wrong') {
      list = quizData.filter(q => userData.history[q.id]?.status === 'wrong');
    } else if (mode === 'review') {
      list = quizData.filter(q => userData.review[q.id] === true);
    }
    return list;
  };

  const startQuiz = async (mode, isResume = false) => {
    let startIdx = 0;
    const list = buildQuestionList(mode);
    
    if (list.length === 0) {
      alert("該当する問題がありません。");
      return;
    }

    if (isResume) {
      startIdx = userData.progressIndex;
      if (startIdx >= list.length) startIdx = 0; // フェールセーフ
    } else {
      // 最初から始める場合はDBの進捗をリセット
      const newData = { ...userData, progressIndex: 0, progressMode: mode };
      setUserData(newData);
      await saveUserDataToFirebase({ progressIndex: 0, progressMode: mode });
    }

    setCurrentMode(mode);
    setCurrentQuestions(list);
    setCurrentIndex(startIdx);
    setSessionResults([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setShowResumePrompt(false);
    setView('quiz');
  };

  const handleResumeChoice = async (choice) => {
    if (choice === 'resume') {
      startQuiz(userData.progressMode, true);
    } else {
      // 最初から
      await saveUserDataToFirebase({ progressIndex: 0 });
      setUserData(prev => ({ ...prev, progressIndex: 0 }));
      setShowResumePrompt(false);
    }
  };

  const handleOptionSelect = async (optIndex) => {
    if (showExplanation) return;
    setSelectedOption(optIndex);
    setShowExplanation(true);

    const currentQ = currentQuestions[currentIndex];
    const isCorrect = optIndex === currentQ.answerIndex;
    
    // 現在のセッション結果に追加
    setSessionResults(prev => [...prev, { qId: currentQ.id, isCorrect }]);

    // userDataを更新（履歴）
    const newHistory = { ...userData.history };
    newHistory[currentQ.id] = {
      status: isCorrect ? 'correct' : 'wrong',
      lastAttempt: new Date().toISOString()
    };

    // 進捗の更新
    const nextIndex = currentIndex + 1;
    const isComplete = nextIndex >= currentQuestions.length;
    const newProgressIndex = isComplete ? 0 : nextIndex;

    const newData = {
      ...userData,
      history: newHistory,
      progressIndex: newProgressIndex,
      progressMode: currentMode
    };

    setUserData(newData);
    // 都度セーブ（落ちても大丈夫なように）
    await saveUserDataToFirebase({
      history: newHistory,
      progressIndex: newProgressIndex,
      progressMode: currentMode
    });
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < currentQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setView('result');
    }
  };

  const toggleReviewFlag = async (qId) => {
    const isReview = userData.review[qId] === true;
    const newReview = { ...userData.review, [qId]: !isReview };
    const newData = { ...userData, review: newReview };
    setUserData(newData);
    await saveUserDataToFirebase({ review: newReview });
  };

  const getStats = () => {
    const total = Object.keys(userData.history).length;
    let correct = 0;
    Object.values(userData.history).forEach(h => {
      if (h.status === 'correct') correct++;
    });
    return { total, correct, wrong: total - correct };
  };

  // --- Renders ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-xl font-bold text-slate-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">スマート問題集</h1>
          <p className="text-center text-sm text-slate-500 mb-6">4-6 情報システムの開発</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">合言葉 (ユーザーID)</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="例: my-secret-key-123"
                className="w-full border-slate-300 rounded-md shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-2">※PCとスマホで同じ合言葉を入力すると履歴が同期されます。</p>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition flex justify-center items-center font-bold"
            >
              ログインして始める <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    const wrongCount = quizData.filter(q => userData.history[q.id]?.status === 'wrong').length;
    const reviewCount = Object.values(userData.review).filter(v => v).length;

    return (
      <div className="max-w-2xl mx-auto p-4 min-h-screen bg-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-slate-800">スマート問題集 Top</h1>
          <button onClick={handleLogout} className="text-sm text-slate-500 underline">ログアウト</button>
        </div>

        {showResumePrompt && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center text-orange-800 mb-3">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-bold">前回の続きから再開しますか？</span>
            </div>
            <p className="text-sm text-orange-700 mb-4">
              {userData.progressMode === 'all' ? '「すべての問題」' : userData.progressMode === 'wrong' ? '「前回不正解のみ」' : '「要復習のみ」'}
              の 第 {userData.progressIndex + 1} 問目まで進んでいます。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleResumeChoice('resume')}
                className="flex-1 bg-orange-600 text-white py-2 rounded-md font-bold hover:bg-orange-700 flex justify-center items-center"
              >
                <Play className="w-4 h-4 mr-1" /> 続きから
              </button>
              <button 
                onClick={() => handleResumeChoice('restart')}
                className="flex-1 bg-white text-orange-600 border border-orange-600 py-2 rounded-md font-bold hover:bg-orange-50"
              >
                最初から
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => startQuiz('all')}
            className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4 text-blue-600"><List className="w-6 h-6"/></div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">すべての問題</h3>
                <p className="text-xs text-slate-500">全 {quizData.length} 問</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" />
          </button>

          <button
            onClick={() => startQuiz('wrong')}
            disabled={wrongCount === 0}
            className={`w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition flex items-center justify-between ${wrongCount === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
          >
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4 text-red-600"><X className="w-6 h-6"/></div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">前回不正解の問題のみ</h3>
                <p className="text-xs text-slate-500">全 {wrongCount} 問</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" />
          </button>

          <button
            onClick={() => startQuiz('review')}
            disabled={reviewCount === 0}
            className={`w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition flex items-center justify-between ${reviewCount === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
          >
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4 text-yellow-600"><CheckSquare className="w-6 h-6"/></div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">要復習の問題のみ</h3>
                <p className="text-xs text-slate-500">全 {reviewCount} 問</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" />
          </button>
        </div>

        <div className="mt-8">
          <button
            onClick={() => setView('history')}
            className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition"
          >
            学習履歴を確認する
          </button>
        </div>
      </div>
    );
  }

  if (view === 'quiz') {
    const q = currentQuestions[currentIndex];
    if (!q) return null; // Safety

    return (
      <div className="max-w-2xl mx-auto p-4 min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-slate-500">
            問題 {currentIndex + 1} / {currentQuestions.length}
          </span>
          <button onClick={() => setView('home')} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full">
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + (showExplanation ? 1 : 0)) / currentQuestions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Area */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-4 flex-grow">
          <div className="flex items-center mb-4">
            <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded mr-2">Q{q.id}</span>
            <h2 className="font-bold text-slate-800">{q.title}</h2>
          </div>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
            {q.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {q.options.map((opt, idx) => {
            let btnClass = "w-full text-left p-4 rounded-xl border-2 transition font-medium ";
            if (!showExplanation) {
              btnClass += "border-slate-200 hover:border-blue-400 hover:bg-blue-50 bg-white";
            } else {
              if (idx === q.answerIndex) {
                btnClass += "border-green-500 bg-green-50 text-green-800";
              } else if (idx === selectedOption) {
                btnClass += "border-red-500 bg-red-50 text-red-800";
              } else {
                btnClass += "border-slate-200 bg-slate-50 text-slate-400 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                disabled={showExplanation}
                onClick={() => handleOptionSelect(idx)}
                className={btnClass}
              >
                <div className="flex items-start">
                  <span className="w-6 h-6 flex-shrink-0 flex justify-center items-center rounded-full bg-white border border-current mr-3 text-sm">
                    {idx + 1}
                  </span>
                  <span>{opt}</span>
                  {showExplanation && idx === q.answerIndex && <Check className="ml-auto w-5 h-5 text-green-600" />}
                  {showExplanation && idx === selectedOption && idx !== q.answerIndex && <X className="ml-auto w-5 h-5 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl mb-6 animate-fade-in">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-blue-900 flex items-center">
                <AlertCircle className="w-5 h-5 mr-1" /> 解説
              </h3>
              <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 transition">
                <input 
                  type="checkbox" 
                  checked={userData.review[q.id] || false}
                  onChange={() => toggleReviewFlag(q.id)}
                  className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 rounded border-gray-300"
                />
                <span className="text-sm font-bold text-slate-700">要復習</span>
              </label>
            </div>
            
            <div className="text-sm text-slate-800 space-y-3">
              <p className="whitespace-pre-wrap font-medium">{q.explanation.summary}</p>
              <div className="h-px w-full bg-blue-200 my-2"></div>
              <p className="whitespace-pre-wrap">{q.explanation.details}</p>
              
              {/* Optional Tables Render */}
              {q.explanation.table && (
                <ul className="mt-3 space-y-2">
                  {q.explanation.table.map((row, i) => (
                    <li key={i} className="bg-white p-3 rounded border border-blue-100">
                      <strong className="block text-blue-800 mb-1">{row.title}</strong>
                      <span className="text-slate-600">{row.desc}</span>
                    </li>
                  ))}
                </ul>
              )}
              {/* Optional Custom Render (for complex diagrams simulated with CSS) */}
              {q.explanation.customRender && q.explanation.customRender()}
            </div>
          </div>
        )}

        {/* Next Button */}
        {showExplanation && (
          <button
            onClick={handleNextQuestion}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-blue-700 transition flex justify-center items-center sticky bottom-4"
          >
            {currentIndex + 1 < currentQuestions.length ? '次の問題へ' : '結果を見る'} <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  if (view === 'result') {
    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    const totalCount = sessionResults.length;
    const score = Math.round((correctCount / totalCount) * 100);

    return (
      <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="bg-white w-full p-8 rounded-2xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">学習完了！</h2>
          <p className="text-slate-500 mb-6">お疲れ様でした。</p>
          
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path className="text-slate-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-blue-500" strokeWidth="3" strokeDasharray={`${score}, 100`} stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-slate-800">
              {score}<span className="text-lg text-slate-500">%</span>
            </div>
          </div>

          <div className="flex justify-center space-x-8 mb-8">
            <div className="text-center">
              <span className="block text-3xl font-bold text-green-500">{correctCount}</span>
              <span className="text-xs text-slate-500">正解</span>
            </div>
            <div className="text-center">
              <span className="block text-3xl font-bold text-red-500">{totalCount - correctCount}</span>
              <span className="text-xs text-slate-500">不正解</span>
            </div>
          </div>

          <button
            onClick={() => { setView('home'); setSessionResults([]); }}
            className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition flex justify-center items-center"
          >
            <Home className="w-5 h-5 mr-2" /> ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    const stats = getStats();
    const pieData = [
      { name: '正解', value: stats.correct, color: '#22c55e' },
      { name: '不正解', value: stats.wrong, color: '#ef4444' },
      { name: '未着手', value: quizData.length - stats.total, color: '#e2e8f0' }
    ];

    return (
      <div className="max-w-2xl mx-auto p-4 min-h-screen bg-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-slate-800 flex items-center">
            <Save className="w-5 h-5 mr-2" /> 学習履歴
          </h1>
          <button onClick={() => setView('home')} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full">
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-center">
          <div className="w-full sm:w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full sm:w-1/2 mt-4 sm:mt-0 sm:pl-6 space-y-3">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded">
              <span className="text-sm font-medium text-slate-600">全問題数</span>
              <span className="font-bold text-slate-800">{quizData.length} 問</span>
            </div>
            <div className="flex justify-between items-center bg-green-50 p-3 rounded">
              <span className="text-sm font-medium text-green-700">解答済 (正解)</span>
              <span className="font-bold text-green-700">{stats.correct} 問</span>
            </div>
            <div className="flex justify-between items-center bg-red-50 p-3 rounded">
              <span className="text-sm font-medium text-red-700">解答済 (不正解)</span>
              <span className="font-bold text-red-700">{stats.wrong} 問</span>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          <h2 className="font-bold text-slate-700 mb-3 px-1">問題別の状況</h2>
          {quizData.map(q => {
            const h = userData.history[q.id];
            const r = userData.review[q.id];
            
            let statusIcon = <div className="w-6 h-6 rounded-full bg-slate-200"></div>;
            if (h?.status === 'correct') statusIcon = <Check className="w-6 h-6 text-green-500" />;
            if (h?.status === 'wrong') statusIcon = <X className="w-6 h-6 text-red-500" />;

            return (
              <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
                <div className="mr-4 flex-shrink-0">
                  {statusIcon}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center">
                    <span className="text-xs font-bold text-slate-400 mr-2">Q{q.id}</span>
                    <span className="font-bold text-slate-800 text-sm line-clamp-1">{q.title}</span>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button 
                    onClick={() => toggleReviewFlag(q.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition ${r ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {r ? '要復習' : '復習に追加'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}