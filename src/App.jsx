// npm install lucide-react firebase

// ============================================================
// Firebase 設定（後で本番の値に書き換えてください）
// ============================================================
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { BookOpen, CheckCircle, XCircle, Flag, RotateCcw, Home, ChevronRight, List, User } from "lucide-react";

const firebaseConfig = {
  apiKey: "AIzaSyCyo4bAZwqaN2V0g91DehS6mHmjZD5XJTc",
  authDomain: "sabu-hide-web-app.firebaseapp.com",
  projectId: "sabu-hide-web-app",
  storageBucket: "sabu-hide-web-app.firebasestorage.app",
  messagingSenderId: "145944786114",
  appId: "1:145944786114:web:0da0c2d87a9e24ca6cf75b",
  measurementId: "G-XSS72H1ZKV"
};

// アプリごとに固有のID（他の問題集と混ざらないよう変更してください）
const APP_ID = "financial-quiz-4-6";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
// 問題データ
// ============================================================
const ALL_QUESTIONS = [
  {
    id: 1,
    title: "情報システム開発の流れ",
    question: "情報システムの開発プロセスに関して、次のa～cの順序として、最も適切なものを下記の解答群から選べ。\n\na　情報システム導入に必要な要員や費用の見積り\nb　プログラムの機能や処理内容の設計\nc　ユーザ・インターフェースの設計",
    choices: [
      "a → b → c",
      "a → c → b",
      "b → c → a",
      "c → a → b",
    ],
    answer: 1,
    explanation: `正解：イ　a → c → b

aの「情報システム導入に必要な要員や費用の見積り」は、「基本計画」で行われます。bの「プログラムの機能や処理内容の設計」は「内部設計」で行われます。cの「ユーザ・インターフェースの設計」は「外部設計」で行われます。外部設計→内部設計の順に行われるので、a→c→bとなります。

【重要ポイント】
情報システム開発の基本的な流れ：基本計画 → 設計（外部設計→内部設計）→ 開発 → テスト → 運用・保守

●基本計画：情報システムの基本的な計画を作成する段階。要件定義などを行う。
●外部設計：利用者から見た仕様を設計（ユーザ・インターフェース、データベース設計など）。
●内部設計：プログラムの内部の仕様を設計（機能・処理内容の設計）。
●開発：設計書を基にデータベースやプログラムを開発。
●テスト：プログラムが仕様どおりに動作するかをテスト。
●運用・保守：定期的なバックアップ、利用者からの問合せ対応など。`,
  },
  {
    id: 2,
    title: "情報システムの開発手法",
    question: "情報システムの開発手法に関する記述として、最も適切なものはどれか。",
    choices: [
      "ウォーターフォール型のシステム開発では、システムの機能や構造を決める内部設計が行われた後に、ユーザ・インターフェースなどを決める外部設計が行われる。",
      "RADは、ウォーターフォール型のシステム開発プロセスを、より短期間で実施できることを目的とした手法である。",
      "スパイラル型のシステム開発では、システムの部分単位に開発プロセスを繰り返しながら、徐々にシステムの完成度を高めていく。",
      "プロトタイピングでは、プロトタイプが問題ないことをユーザに確認してもらえば、その後に開発する本格的なシステムは問題なく稼働する。",
    ],
    answer: 2,
    explanation: `正解：ウ

ア×：ウォーターフォール型では、外部設計を行ってから内部設計が行われます。

イ×：RAD（Rapid Application Development）は、プロトタイプ型と同じく試作品を作って開発を進める手法です。プロトタイプを完成イメージに近付けるため、製作と評価を繰り返しながら開発が進められます。

ウ○：正しい記述です。スパイラル型の説明として正確です。

エ×：プロトタイピング（プロトタイプ型）は、プロトタイプが問題ないことをユーザに確認してもらいますが、その後に本格的なシステムを開発するプロセスではテストを行います。

【重要ポイント】
●ウォーターフォール型：上流工程から順番に実施（基本計画→設計→開発→テスト→運用）
●プロトタイプ型：早い段階でプロトタイプ（試作品）を作成し、ユーザが確認してから本格開発
●スパイラル型：設計・開発・テストを何度も繰り返して徐々にシステムを成長させる`,
  },
  {
    id: 3,
    title: "PMBOK",
    question: "プロジェクト管理の知識体系であるPMBOK（第7版まで）に関する記述として、最も不適切なものはどれか。",
    choices: [
      "PMBOKは、情報システム以外のプロジェクトにも対応している。",
      "PMBOKでは、プロジェクトマネジメントの12の原理・原則、プロジェクトマネジメントの10の知識エリアが定義されている。",
      "PMBOKは、米国プロジェクトマネジメント協会（PMI）が策定・改定している。",
      "WBSは、成果物を得るために必要な工程や作業について記述する。",
    ],
    answer: 1,
    explanation: `正解：イ（最も不適切）

ア○：正しい記述です。PMBOKは情報システムに限らず、プロジェクトマネジメントの遂行に必要な基本的な知識を汎用的な形で体系立てて整理したものです。

イ×（不適切）：PMBOK第7版では、「10の知識エリア」という概念がなくなり、「8のパフォーマンス・ドメイン」という概念が登場しました。

ウ○：正しい記述です。なお、PMIではPMBOKに準拠した国際的な認定制度「PMP」（Project Management Professional）を展開しています。

エ○：PMBOKのスコープマネジメントにて、WBS（Work Breakdown Structure）が取り上げられています。WBSとは、プロジェクトの全ての作業を階層構造で表したものです。

【重要ポイント】
PMBOK（Project Management Body of Knowledge）：プロジェクト管理の方法を体系的にまとめたもの。
第7版（2021年発表）：12の原理・原則 ＋ 8のパフォーマンス・ドメイン（「10の知識エリア」から変更）`,
  },
  {
    id: 4,
    title: "EVMS",
    question: "システム開発プロジェクトの管理に使われるEVMSに関する記述として、最も不適切なものはどれか。",
    choices: [
      "EVMSでは、プロジェクトの全ての作業を金銭価値に置きなおし、プロジェクトの進捗において、作業の進捗度を金額で表現することで管理する。",
      "EVMSを用いると、進捗状況が明確になるが、計画変更の管理が煩雑になりやすいという問題がある。",
      "EVMSでは、アーンドバリューとベースラインを比較することで、進捗度合いを定量的に把握する。",
      "EVMSは、小規模なプロジェクトでの適用には向いているが、大規模プロジェクトには向かない。",
    ],
    answer: 3,
    explanation: `正解：エ（最も不適切）

ア○：正しい記述です。EVMSは、作業の工数を金額に換算する点が特徴です。

イ○：EVMSでは、計画変更があった場合、再度、金額に換算する必要があることなどから、計画変更時の管理は煩雑になります。

ウ○：アーンドバリューとは作業の進捗を金額で表したもの、ベースラインとは作業の見積もりを金額に換算して計算したものです。

エ×（不適切）：EVMSは、厳密に管理できる一方で、管理のための手間がかかることから、小規模プロジェクトよりもむしろ大規模プロジェクトに向いています。

【重要ポイント】
EVMS（Earned Value Management System：出来高管理システム）
・作業の進捗度を金額で表現することで管理する手法
・ベースライン：プロジェクト計画の各作業を金額に換算したもの
・アーンドバリュー：実際の作業進捗を金額で表したもの
・大規模プロジェクトに向いている`,
  },
  {
    id: 5,
    title: "要件定義",
    question: "情報システムの要件定義に関する記述として、最も不適切なものはどれか。",
    choices: [
      "要件定義では、システムの仕様およびシステム化の範囲と機能を明確にし、利害関係者間で合意する。",
      "数値化していない要件は、それを満たしているか否かの判断基準が人によって異なるため、数値化すべきである。",
      "要件は漏れなく明確化する必要があるため、未確定な部分があるときは決定を先送りすべきである。",
      "要件定義では、システム利用者のニーズの整理を行う。",
    ],
    answer: 2,
    explanation: `正解：ウ（最も不適切）

ア○：正しい記述です。

イ○：正しい記述です。例えば、障害発生時の復旧について「速やかに」ではなく「1分以内に復旧」「1時間以内に復旧」などと数値化します。

ウ×（不適切）：要件は次の工程のインプットになるため、漏れなく明確化する必要がありますが、未確定な部分があるときは先送りすることなく、対象範囲として含めるもしくは含めないなど決定すべきです。

エ○：正しい記述です。要件定義では、ユーザーヒアリングなどにより、システム利用者のニーズを整理して、現状の業務プロセスの改善点や、要件を洗い出していきます。

【重要ポイント】
要件定義は情報システム開発の「基本計画」の工程で行われます。
一般的な流れ：
1. 経営上解決したい課題を基に、情報システムの目的と業務範囲を決定
2. 対象範囲について現状の業務プロセスや情報システムを分析
3. ユーザーヒアリング等により改善点・新たな要件を洗い出し`,
  },
  {
    id: 6,
    title: "RFPとRFI",
    question: "ユーザ企業がITベンダーに提出する文書に関する記述として、最も適切なものはどれか。",
    choices: [
      "RFIとは、システムが提供するサービスの品質保証やペナルティに関する契約内容を明らかにし、ITベンダーと合意する文書をいう。",
      "SLAとは、発注先候補のITベンダーに情報提供を依頼する文書をいう。",
      "RFP とは、ITベンダーからの提案を評価・検討し、システム開発を依頼する文書をいう。",
      "RFP とは、システムの概要や主要な機能などに関する提案を依頼する文書をいう。",
    ],
    answer: 3,
    explanation: `正解：エ

ア×：選択肢の記述の内容はSLAの説明です。RFIは、情報システムの導入や業務委託を行うにあたり、発注先候補のシステム開発会社に情報提供を依頼するための文書です。

イ×：選択肢の記述の内容はRFIの説明です。SLAは、サービス提供者とサービス委託者との間で、提供するサービス内容と範囲・品質に対する水準などをあらかじめ定めておくものです。

ウ×：選択肢の記述の内容は、システム開発の発注書の説明です。

エ○：正しい記述です。RFPは、システム開発の発注に先立ち、システムの概要や主要な機能などに関する提案を依頼する文書のことです。

【重要ポイント】
●RFI（Request For Information：情報提供依頼書）：発注先候補のシステム開発会社に情報提供を依頼する文書
●RFP（Request For Proposal：提案依頼書）：ITベンダーなどの業者から具体的な提案をしてもらうために、システムに対する要件を伝えるための文書
●SLA（Service Level Agreement）：サービス提供者とサービス委託者との間で、提供するサービス内容と範囲・品質に対する水準を定め、達成できなかった場合のルールをあらかじめ合意しておく文書・契約`,
  },
  {
    id: 7,
    title: "工数と費用の見積り",
    question: "情報システム開発の工数と費用の見積りに関する次の文中の空欄Ａ～Ｃに入る語句の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\n情報システムの開発工数を見積る手法の1つとして、システムの持つ機能をもとに、機能ごとの複雑さなどから（　Ａ　）という点数をつけて評価する方法がある。\n\nこの方法では、まずシステムの機能を洗い出し、機能のタイプごとに機能の数を数えます。次に、機能ごとに複雑さを評価し、（　Ｂ　）段階のタイプに分けます。さらに、各タイプ別の係数を掛けて（　Ａ　）を計算します。\n\nこれは、詳細なプログラムなどの設計の（　Ｃ　）に行われます。",
    choices: [
      "Ａ：ファンクションポイント　Ｂ：3　Ｃ：前",
      "Ａ：スコアリングモデル　Ｂ：4　Ｃ：前",
      "Ａ：ファンクションポイント　Ｂ：4　Ｃ：後",
      "Ａ：スコアリングモデル　Ｂ：3　Ｃ：後",
    ],
    answer: 0,
    explanation: `正解：ア

A：ファンクションポイント
スコアリングモデルとは、定性的な評価項目を定量化する方法です。定性的な評価項目のそれぞれに対して重み付けをして、一つの数式で表現し定量化します。

B：3
ファンクションポイント法では、機能ごとに複雑さを評価して、「簡単」「普通」「複雑」の3段階に分けます。

C：前
このような開発工数の見積もりは、詳細なプログラムを設計する前の「基本設計」のプロセスにて行われます。ファンクションポイント法では、必要な機能が分かった段階で工数と費用の概算見積りを行うことができます。

【重要ポイント】
ファンクションポイント法：開発工数の見積りの代表的な方法の１つ。
機能（ファンクション）ごとの複雑さによって点数を付け、その点数を合計することによって工数を見積る方法。
複雑さは「簡単」「普通」「複雑」の3段階に分類。`,
  },
  {
    id: 8,
    title: "UML",
    question: "業務システムの分析・設計に用いられるUMLに関する記述として、最も適切なものはどれか。",
    choices: [
      "UMLは、オブジェクト指向によるシステム開発の方法論である。",
      "UMLにて、設計図をどのような順序で用いるかは、UML標準で決められている。",
      "ネットワーク図は、オブジェクト間の処理プロセスを表現するUMLのダイアグラムの1つである。",
      "ユースケース図は、システムにどのような利用者がいるか、その利用者がどのような操作をするかを表すUMLのダイアグラムの１つである。",
    ],
    answer: 3,
    explanation: `正解：エ

ア×：UMLは、オブジェクト指向アプローチのシステム開発における、設計図の統一表記法です。システム開発に関する方法論は含まれていません。

イ×：UMLは、設計図の種類や書き方を定義したものであり、方法論は含まれていないため、どの設計書をどういう順序で使うかは定められていません。

ウ×：シーケンス図の説明に関する記述です。UMLにネットワーク図というダイアグラムは含まれていません。

エ○：正しい記述です。ユースケース図では、機能をユースケースで表し、機能を利用する人や外部システムをアクターで表して、これらの関係を表現します。

【重要ポイント】
UML（Unified Modeling Language）：オブジェクト指向アプローチのシステム開発における設計図の統一表記法

代表的なUMLのダイアグラム：
●ユースケース図：要件定義等の上流工程で業務の機能を表現（アクターとユースケースの関係）
●クラス図：オブジェクトの「型」を定義
●シーケンス図：オブジェクト間の処理プロセスを表す`,
  },
  {
    id: 9,
    title: "情報システムの設計1",
    question: "情報システムの設計に関する記述として、最も適切なものはどれか。",
    choices: [
      "DFDは、プロセス指向アプローチで用いられ、データの流れと時間的情報を記述する手法である。",
      "ER図は、データ指向アプローチで用いられる図表であり、データ間の関連を描画する。",
      "STDは、オブジェクト指向アプローチで用いられる、モデリング言語の１つである。",
      "DOAでは、システム開発後のデータ構造の変更が必要な際、一部のプログラムへの影響で抑えられやすい。",
    ],
    answer: 1,
    explanation: `正解：イ

ア×：DFDは、データの処理の流れを記述しますが、時間的情報については記述されません。

イ○：正しい記述です。なお、ER図は、ERD（Entity-Relationship Diagram）とも呼ばれます。

ウ×：STDは、状態遷移図とも呼ばれ、システムの状態がイベントによってどのように変わるのかを表した図で、外部設計や内部設計において、主に画面設計の際に用いられます。オブジェクト指向アプローチで用いられるモデリング言語としては、UMLがあります。

エ×：DOAでは、プログラムを追加・変更するときにはデータ構造は変更しなくて良いため、システムの変更や拡張に対応しやすいというメリットがあります。一方で、データ構造を変更する場合は、関連するプログラムを全て変更する必要があります。

【重要ポイント】
設計アプローチの種類：
●POA（プロセス指向アプローチ）：業務プロセスに着目。フローチャートやDFDを使用。
●DOA（データ指向アプローチ）：データ構造に着目。E-Rモデル（ER図）を使用。エンティティとリレーションでデータ構造を表す。
●OOA（オブジェクト指向アプローチ）：データと処理をカプセル化。UMLを使用。`,
  },
  {
    id: 10,
    title: "情報システムの設計2",
    question: "情報システムの設計に用いられる下記の図（DFD：データフローダイアグラム）に関する説明として、最も適切なものを下記の解答群の中から選べ。\n\n【図の説明】\n外部エンティティ（受注）→ プロセス「受注入力」← データストア「商品ファイル」\nプロセス「受注入力」→ データストア「在庫ファイル」\nプロセス「受注入力」→ データストア「注文ファイル」\nプロセス「受注入力」→ 外部エンティティ（得意先）\n\n※この図はPOA（プロセス指向アプローチ）で用いられるDFD（データフローダイアグラム）の例示です。",
    choices: [
      "データベースをどのように構築したらいいかを示すERDである。",
      "業務とデータの処理の関係を記述したDFDである。",
      "データと処理をセットにしたクラス図である。",
      "図中の「商品ファイル」や「在庫ファイル」は、データマートと呼ばれる。",
    ],
    answer: 1,
    explanation: `正解：イ

ア×：図はDFDであるため、記述は不適切です。

イ○：正しい記述です。

ウ×：図はDFDであるため、記述は不適切です。

エ×：図中の「商品ファイル」や「注文ファイル」は、データストアです。データマートとは、全社のデータが蓄積されたデータウェアハウスから、テーマ別にデータを抽出したものであり、BI（Business Intelligence）にて利用されます。

【重要ポイント】
DFD（Data Flow Diagram：データフローダイアグラム）：POAで用いられる図表。データと処理の流れを表す。
DFDの構成要素：
●外部エンティティ：データの源や受け取り先
●プロセス：データの変換・処理
●データストア：データの保存場所
●データフロー：データの流れを示す矢印

ERD（ER図）：DOAで用いられる。エンティティとリレーションでデータ構造を表す。
クラス図：OOAで用いられるUMLの一種。`,
  },
  {
    id: 11,
    title: "XP（エクストリーム･プログラミング）",
    question: "XP（エクストリーム･プログラミング）に関する記述として、最も不適切なものはどれか。",
    choices: [
      "XPはアジャイル開発の手法の１つであり、小規模なシステムの開発に向いている。",
      "XPでは、設計・開発・テストを繰り返して、システム開発を進めていく。",
      "XPのプラクティスとして、ビジュアルプログラミングが定められている。",
      "XPでは、原理とすべき価値と具体的なプラクティスが定められている。",
    ],
    answer: 2,
    explanation: `正解：ウ（最も不適切）

ア○：正しい記述です。XPを含め、アジャイル開発は比較的小規模なシステムの開発に向いています。

イ○：アジャイル開発手法では、開発対象を多数の小さな機能に分割し、1つの反復（イテレーション）で1機能を開発します。イテレーションのサイクルを継続して行い、機能を追加開発していきます。各イテレーションの中では、設計、開発（コーディング）、テストといった工程を行います。

ウ×（不適切）：XPには複数のプラクティスが定められていますが、ビジュアルプログラミングというプラクティスは含まれていません。XPの代表的なプラクティスとして、ペアプログラミングが挙げられます。ペアプログラミングでは、1人がプログラムのコードを書き、隣にいるもう1人が同時にそれをチェックしながら作業を進めます。

エ○：XPでは、原理とすべき価値が定められています。XPの価値とは、「コミュニケーション」「シンプル」「フィードバック」「勇気」「尊重」です。

【重要ポイント】
XP（eXtreme Programming）：アジャイル開発の手法の1つ。
特徴：プロジェクトを短い期間に区切り、反復的に設計・開発・テストを繰返す。小規模システムに向いている。
代表的プラクティス：ペアプログラミング（ビジュアルプログラミングではない）`,
  },
  {
    id: 12,
    title: "RAD（Rapid Application Development）",
    question: "RAD（Rapid Application Development）に関する記述として、最も適切なものはどれか。",
    choices: [
      "RADは、比較的長期間のプロジェクトに適用される開発手法である。",
      "RADでは、開発サイクルを繰り返すことによって、システムの完成度を高めていく。",
      "RADでは、エンジニアだけでなく、エンドユーザも含めたチームでプロジェクトを進める。",
      "RADで用いられるCASEツールは、コーディングやテスト工程の生産を高めるためのものであり、設計工程は対象としていない。",
    ],
    answer: 2,
    explanation: `正解：ウ

ア×：RADは、小規模・短期間のプロジェクトに適用される手法です。

イ×：RADは、プロトタイプと呼ばれるシステムの完成イメージを何度も制作・評価し、次第に完成品に近づけていきます。開発サイクルを繰り返すことによってシステムの完成度を高めていく手法は、スパイラルモデルと言います。

ウ○：正しい記述です。RADでは、プロトタイプをエンドユーザが評価・確認しながら、開発を進めていきます。

エ×：CASEツールは、従来は人間の手で行っていた、設計工程やプログラミングの作業を、コンピュータで支援するためのソフトウェアです。
・上流CASEツール：設計など上流工程を支援
・下流CASEツール：プログラミングなどの下流工程を支援
・統合CASEツール：上記を統合したもの

【重要ポイント】
RAD（Rapid Application Development）：プロトタイプを次第に完成品に近づけていく手法。ウォーターフォールモデルなど従来の手法より迅速に開発を進められる。
特徴：エンドユーザを含む少人数のチームで担当、プロトタイピングやCASEツールを活用、小規模・短期間向け。`,
  },
  {
    id: 13,
    title: "システムテスト",
    question: "システムテスト（総合テスト）に関する記述として、最も適切なものはどれか。",
    choices: [
      "システムテストでは、想定される最大業務負荷に耐えられるかどうかの確認が行われる。",
      "システムテストでは、主にモジュールやプログラム間のインターフェースや相互の関連性を検証する。",
      "システムテストでは、適正なデータを用いてテストを行い、例外処理は対象としなくてよい。",
      "システムテストは、利用ユーザが中心となって行う。",
    ],
    answer: 0,
    explanation: `正解：ア

ア○：正しい記述です。システムテストでは、情報システム全体の性能のテストも行われ、想定される最大業務負荷に耐えられるかどうかの確認が行われます。これを、性能テストや負荷テストとも呼ばれます。

イ×：モジュールやプログラム間のインターフェースや相互の関連性を検証するのは、結合テストです。

ウ×：システムテストでは、正常な処理だけではなく、例外処理についてもテストを行います。これは例外テストとも呼ばれます。

エ×：システムテストは、情報システム部門やソフトウェアハウスなどが中心となって行われます。利用ユーザが中心となって行うのは、検収テスト（受入テスト）です。

【重要ポイント】
テストの順番：単体テスト → 結合テスト → システムテスト（総合テスト）→ 検収テスト（受入テスト）

●単体テスト：モジュールごとのテスト
●結合テスト：複数のモジュールの組み合わせをテスト
●システムテスト：情報システム全体の機能や性能などを確認（情報システム部門が中心）
●検収テスト：ユーザ部門に引き渡す時のテスト（利用ユーザが中心）`,
  },
  {
    id: 14,
    title: "ウォークスルー",
    question: "ソフトウェア品質レビュー技法のうち、ウォークスルーに関する記述として、最も適切なものはどれか。",
    choices: [
      "プログラム作成者、進行まとめ役、記録役、説明役、レビュー役を明確に決めて、厳格なレビューを公式に行う。",
      "プログラムを動作させて行う動的テストの１つである。",
      "システム開発者が集まって実施され、プロジェクト責任者は参加が必須である。",
      "システム開発の早い時期で、欠陥を発見するために行われる。",
    ],
    answer: 3,
    explanation: `正解：エ

ア×：インスペクションに関する記述です。ウォークスルーは公式なレビューではありません。

イ×：ウォークスルーやインスペクションは、プログラムを動作させて行う動的テストではなく、プログラムの動作を伴わない静的テストです。

ウ×：ウォークスルーは、システム開発者が集まって実施されますが、プロジェクト責任者は参加が必須ではありません。必要に応じて、インフォーマルに開発者が集まって実施します。

エ○：正しい記述です。ソフトウェアが完成する前の工程で、問題点を発見して、早期に欠陥を除去するために行われます。

【重要ポイント】
●ウォークスルー：開発者達が運営する非公式なレビュー。静的テスト。開発の早い時期に欠陥を発見するために行われる。プロジェクト責任者の参加は任意。
●インスペクション：公式なレビュー。プロジェクト責任者の下で厳密に行われる。役割（プログラム作成者・進行まとめ役・記録役・説明役・レビュー役）が明確に決まっている。`,
  },
  {
    id: 15,
    title: "ホワイトボックステスト、ブラックボックステスト",
    question: "ホワイトボックステストやブラックボックステストに関する記述として、最も適切なものはどれか。",
    choices: [
      "ホワイトボックステストでは、分岐命令やモジュールの数が増えると、テストデータが急増する。",
      "ブラックボックステストでは、テストデータの作成基準として、命令や分岐の網羅率を使用する。",
      "ホワイトボックステストでは、プログラムの入力と出力の関係に注目してテストデータを作成する。",
      "ブラックボックステストは、単体テストでのみ実施される。",
    ],
    answer: 0,
    explanation: `正解：ア

ア○：ホワイトボックステストでは、プログラム中の分岐命令やモジュールなどの数が増えると、テスト対象として、それらの条件分岐やモジュールの組み合わせの数が等比級数的に増加します。

イ×：網羅率とは、ホワイトボックステストを行うときに用いる基準で、プログラムに対して、どの程度テストを実施したかを表すための指標です。

ウ×：プログラムの入力と出力の関係に注目してテストデータを作成するのは、ブラックボックステストです。ホワイトボックステストでは、プログラムの内部構造に着目してテストデータを作成します。

エ×：ブラックボックステストは、単体テストだけでなく、結合テストやシステムテスト、検収テストの段階でも行われます。

【重要ポイント】
●ホワイトボックステスト：プログラムの内部構造に注目。命令文や条件分岐について漏れなく網羅的にテスト。「網羅率」を使用。分岐やモジュールが増えるとテストデータが急増。
●ブラックボックステスト：プログラムの入力と出力に注目。内部の動作は問わない。正常入力だけでなく不正な入力による例外処理も検証。単体テスト以外でも使用。`,
  },
  {
    id: 16,
    title: "結合テスト",
    question: "結合テストに関する記述として、最も不適切なものはどれか。",
    choices: [
      "結合テストの方法の１つにビッグバンテストがあり、複数のモジュールを一挙に結合して、その動作を検証する。",
      "ビッグバンテストでは、結合テスト全体の時間が短縮できるメリットがある一方、バグのある箇所の特定が難しく、かえって時間がかかってしまったり、バグが残りやすくなったりするなどのリスクもある。",
      "上位のモジュールから順番に結合してテストをしていく手法をトップダウンテストという。また、下位のモジュールから順番に結合してテストをしていく手法のことを、ボトムアップテストという。",
      "上位モジュールと下位モジュールを結合してテストを実施したいが上位モジュールが完成していない場合、スタブと呼ばれるダミーモジュールを作ってテストする。",
    ],
    answer: 3,
    explanation: `正解：エ（最も不適切）

ア○：ビッグバンテストの内容の説明として、適切です。

イ○：ビッグバンテストの特徴の説明として、適切です。

ウ○：トップダウンテストとボトムアップテストの概要の説明として、適切です。

エ×（不適切）：スタブとは、下位モジュールが完成していない場合に使われるダミーモジュールのことです。上位モジュールが完成していない場合に使われるダミーモジュールは、ドライバと呼ばれます。

【重要ポイント】
●トップダウンテスト：上位のモジュールから順番に結合してテスト。下位モジュールが未完成の場合は「スタブ」（ダミー）を使用。
●ボトムアップテスト：下位のモジュールから順番に結合してテスト。上位モジュールが未完成の場合は「ドライバ」（ダミー）を使用。
●ビッグバンテスト：全モジュールを一斉に結合してテスト。時間短縮のメリットがあるが、バグ特定が難しいリスクがある。`,
  },
];

// ============================================================
// メインコンポーネント
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("login"); // login | home | quiz | answer | results | history
  const [userId, setUserId] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState({}); // { qId: { correct: bool, review: bool, answeredAt: string } }
  const [mode, setMode] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);

  // Firestoreからデータ読み込み
  const loadData = useCallback(async (uid) => {
    console.log("[loadData] userId:", uid);
    setLoading(true);
    try {
      const ref = doc(db, APP_ID, uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        console.log("[loadData] loaded:", data);
        setHistory(data.history || {});
      } else {
        console.log("[loadData] no data, init empty");
        setHistory({});
      }
    } catch (e) {
      console.error("[loadData] error:", e);
      setHistory({});
    }
    setLoading(false);
  }, []);

  // Firestoreへ保存
  const saveData = useCallback(async (uid, newHistory) => {
    console.log("[saveData] saving:", uid, newHistory);
    try {
      const ref = doc(db, APP_ID, uid);
      await setDoc(ref, { history: newHistory }, { merge: true });
      console.log("[saveData] saved successfully");
    } catch (e) {
      console.error("[saveData] error:", e);
    }
  }, []);

  const handleLogin = async () => {
    const uid = userIdInput.trim();
    if (!uid) return;
    console.log("[login] uid:", uid);
    setUserId(uid);
    await loadData(uid);
    setScreen("home");
  };

  const startQuiz = () => {
    let qs = [...ALL_QUESTIONS];
    if (mode === "incorrect") {
      qs = qs.filter(q => history[q.id]?.correct === false);
    } else if (mode === "review") {
      qs = qs.filter(q => history[q.id]?.review === true);
    }
    if (qs.length === 0) {
      alert("該当する問題がありません。");
      return;
    }
    console.log("[startQuiz] mode:", mode, "count:", qs.length);
    setQuestions(qs);
    setCurrentIndex(0);
    setSelected(null);
    setSessionResults([]);
    setScreen("quiz");
  };

  const handleSelect = (idx) => {
    if (selected !== null) return;
    console.log("[handleSelect] selected:", idx);
    setSelected(idx);
    const q = questions[currentIndex];
    const correct = idx === q.answer;
    const now = new Date().toISOString();
    const prev = history[q.id] || {};
    const updated = {
      ...history,
      [q.id]: {
        ...prev,
        correct,
        answeredAt: now,
        review: prev.review || false,
      },
    };
    setHistory(updated);
    saveData(userId, updated);
    setSessionResults(prev => [...prev, { id: q.id, correct }]);
    setScreen("answer");
  };

  const toggleReview = (qId) => {
    const prev = history[qId] || {};
    const updated = {
      ...history,
      [qId]: { ...prev, review: !prev.review },
    };
    console.log("[toggleReview] qId:", qId, "->", !prev.review);
    setHistory(updated);
    saveData(userId, updated);
  };

  const goNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setScreen("results");
    } else {
      setCurrentIndex(i => i + 1);
      setSelected(null);
      setScreen("quiz");
    }
  };

  const resetHistory = async () => {
    if (!window.confirm("履歴をリセットしますか？")) return;
    console.log("[resetHistory]");
    setHistory({});
    await saveData(userId, {});
  };

  // ============================================================
  // 統計
  // ============================================================
  const totalAnswered = Object.keys(history).length;
  const totalCorrect = Object.values(history).filter(h => h.correct).length;
  const totalReview = Object.values(history).filter(h => h.review).length;
  const incorrectCount = Object.values(history).filter(h => h.correct === false).length;

  // ============================================================
  // レンダリング
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ログイン画面
  if (screen === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800">スマート問題集</h1>
            <p className="text-gray-500 text-sm mt-1">4-6 情報システムの開発</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              ユーザーID（合言葉）
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: hide2024"
              value={userIdInput}
              onChange={e => setUserIdInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <p className="text-xs text-gray-400 mt-2">同じIDをPCとスマホで入力すると学習履歴を同期できます</p>
          </div>
          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            onClick={handleLogin}
          >
            開始する
          </button>
        </div>
      </div>
    );
  }

  // ホーム画面
  if (screen === "home") {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold text-gray-800">4-6 情報システムの開発</h1>
                <p className="text-xs text-gray-400">ユーザー: {userId}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
            {/* 統計 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{ALL_QUESTIONS.length}</p>
                <p className="text-xs text-gray-500">全問題</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{totalCorrect}</p>
                <p className="text-xs text-gray-500">正解</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{incorrectCount}</p>
                <p className="text-xs text-gray-500">不正解</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">{totalReview}</p>
                <p className="text-xs text-gray-500">要復習</p>
              </div>
            </div>
            {totalAnswered > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>正解率</span>
                  <span>{Math.round((totalCorrect / totalAnswered) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round((totalCorrect / totalAnswered) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* モード選択 */}
          <div className="bg-white rounded-2xl shadow p-6 mb-4">
            <h2 className="font-semibold text-gray-700 mb-3">出題モード</h2>
            <div className="space-y-2">
              {[
                { key: "all", label: "すべての問題", count: ALL_QUESTIONS.length },
                { key: "incorrect", label: "前回不正解の問題のみ", count: incorrectCount },
                { key: "review", label: "要復習の問題のみ", count: totalReview },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    mode === m.key
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className={`text-sm font-bold ${mode === m.key ? "text-blue-600" : "text-gray-400"}`}>
                    {m.count}問
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow hover:bg-blue-700 transition-colors mb-3"
            onClick={startQuiz}
          >
            クイズを始める
          </button>
          <button
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            onClick={() => setScreen("history")}
          >
            <List className="w-4 h-4" />
            履歴を見る
          </button>
        </div>
      </div>
    );
  }

  // クイズ画面
  if (screen === "quiz") {
    const q = questions[currentIndex];
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setScreen("home")} className="text-gray-400 hover:text-gray-600">
              <Home className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500">{currentIndex + 1} / {questions.length}</span>
            <div className="w-5" />
          </div>
          {/* プログレスバー */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">問題 {q.id}</span>
              <span className="text-xs text-gray-500">{q.title}</span>
              {history[q.id]?.review && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">要復習</span>
              )}
            </div>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{q.question}</p>
          </div>
          <div className="space-y-3">
            {q.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className="w-full text-left bg-white rounded-xl shadow px-5 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent transition-all"
              >
                <span className="font-bold text-blue-500 mr-2">{["ア", "イ", "ウ", "エ"][idx]}</span>
                {choice}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 解答・解説画面
  if (screen === "answer") {
    const q = questions[currentIndex];
    const isCorrect = selected === q.answer;
    const isReview = history[q.id]?.review || false;
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setScreen("home")} className="text-gray-400 hover:text-gray-600">
              <Home className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500">{currentIndex + 1} / {questions.length}</span>
            <div className="w-5" />
          </div>

          {/* 正誤 */}
          <div className={`rounded-2xl p-4 mb-4 flex items-center gap-3 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            {isCorrect
              ? <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              : <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />}
            <p className={`font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
              {isCorrect ? "正解！" : "不正解"}
            </p>
          </div>

          {/* 選択肢 */}
          <div className="bg-white rounded-2xl shadow p-5 mb-4">
            <p className="text-xs font-semibold text-gray-400 mb-3">問題 {q.id}：{q.title}</p>
            <p className="text-sm text-gray-700 mb-4 whitespace-pre-line leading-relaxed">{q.question}</p>
            <div className="space-y-2">
              {q.choices.map((choice, idx) => {
                let cls = "bg-gray-50 text-gray-600";
                if (idx === q.answer) cls = "bg-green-100 text-green-800 border border-green-400";
                else if (idx === selected && idx !== q.answer) cls = "bg-red-100 text-red-800 border border-red-300";
                return (
                  <div key={idx} className={`rounded-xl px-4 py-3 text-sm ${cls}`}>
                    <span className="font-bold mr-2">{["ア", "イ", "ウ", "エ"][idx]}</span>
                    {choice}
                    {idx === q.answer && <span className="ml-2 text-xs font-bold text-green-700">← 正解</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 解説 */}
          <div className="bg-white rounded-2xl shadow p-5 mb-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">解説</p>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{q.explanation}</p>
          </div>

          {/* 要復習 */}
          <button
            onClick={() => toggleReview(q.id)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl mb-4 font-medium text-sm border-2 transition-all ${
              isReview
                ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                : "bg-white border-gray-200 text-gray-500 hover:border-yellow-300"
            }`}
          >
            <Flag className="w-4 h-4" />
            {isReview ? "要復習を解除" : "要復習に追加"}
          </button>

          <button
            onClick={goNext}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            {currentIndex + 1 >= questions.length ? "結果を見る" : "次の問題"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // 結果画面
  if (screen === "results") {
    const correct = sessionResults.filter(r => r.correct).length;
    const total = sessionResults.length;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow p-8 text-center mb-4">
            <p className="text-5xl font-bold text-blue-600 mb-2">{pct}%</p>
            <p className="text-gray-500 text-sm mb-4">{total}問中 {correct}問正解</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {sessionResults.map((r, i) => {
                const q = ALL_QUESTIONS.find(q => q.id === r.id);
                return (
                  <div key={i} className={`rounded-xl p-3 text-left ${r.correct ? "bg-green-50" : "bg-red-50"}`}>
                    <p className="text-xs font-bold text-gray-500">Q{r.id}</p>
                    <p className="text-xs text-gray-700 truncate">{q?.title}</p>
                    <p className={`text-xs font-bold mt-1 ${r.correct ? "text-green-600" : "text-red-600"}`}>
                      {r.correct ? "✓ 正解" : "✗ 不正解"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => setScreen("home")}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // 履歴画面
  if (screen === "history") {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setScreen("home")} className="text-gray-400 hover:text-gray-600">
              <Home className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">履歴一覧</h2>
          </div>
          <div className="space-y-2">
            {ALL_QUESTIONS.map(q => {
              const h = history[q.id];
              return (
                <div key={q.id} className="bg-white rounded-xl shadow px-4 py-3 flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6">Q{q.id}</span>
                  <span className="text-sm text-gray-700 flex-1">{q.title}</span>
                  <div className="flex items-center gap-2">
                    {h?.review && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">要復習</span>
                    )}
                    {h ? (
                      h.correct
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <span className="text-xs text-gray-300">未回答</span>
                    )}
                    <button
                      onClick={() => toggleReview(q.id)}
                      className={`p-1 rounded-full transition-colors ${h?.review ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={resetHistory}
            className="w-full mt-6 bg-red-50 text-red-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            履歴をリセット
          </button>
        </div>
      </div>
    );
  }

  return null;
}