(() => {
  'use strict';

  /* ========= 起動テスト用パラメータ ========= */
  const N_BLOCKS = 4;            // ブロック数
  const REPEATS_PER_IMAGE = 2;   // 1ブロック内で各画像を何回出すか（5枚×2=10試行）
  const ISI_MS = 500;            // 刺激間ブランク(ms)

  /* ========= 刺激定義（実在する画像だけ） ========= */
  const expressions = ["happy"];
  const variants    = ["01"];
  const genders     = ["F01"];
  const imageBackgrounds = ["black","blue","red","white","yellow"];
  const EXT = "png";
  const USE_GENDER_SUBFOLDER = true;

  // 参加者ID（URL ?pid= などが無ければ手入力）
　const PID = `p_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  const EXP_START_ISO = new Date().toISOString();

  // 画像リスト（オブジェクトで保持）
  const baseImages = [];
  genders.forEach(g => {
    expressions.forEach(expr => {
      variants.forEach(v => {
        imageBackgrounds.forEach(bg => {
          baseImages.push({
            src: USE_GENDER_SUBFOLDER
              ? `img/${g}/${expr}${v}_${bg}.${EXT}`
              : `img/${expr}${v}_${bg}.${EXT}`,
            gender: g,
            expression: expr,
            variant: v,
            image_bg: bg
          });
        });
      });
    });
  });

  // デバッグ（必要なら残す）
  console.log('[DEBUG] baseImages length:', baseImages.length);
  console.log('[DEBUG] sample image path:', baseImages[0]?.src);
  console.log('[DEBUG] all image paths:', baseImages.map(s => s.src));

  /* ========= jsPsych 初期化 ========= */
  const jsPsych = initJsPsych({
    override_safe_mode: true, // file:// でも動くように（Live Server推奨）
    on_finish: () => {
      jsPsych.data.addProperties({ exp_end_iso: new Date().toISOString() });
      jsPsych.data.displayData(); // 結果表示（CSV保存したい場合は下の行を使う）
      // jsPsych.data.get().localSave('csv', `data_${PID}_${new Date().toISOString().replace(/[:.]/g,'-')}.csv`);
    }
  });
  jsPsych.data.addProperties({ participant_id: PID, exp_start_iso: EXP_START_ISO });

  /* ========= プリロード ========= */
  const preload = {
    type: jsPsychPreload,
    auto_preload: false,
    images: baseImages.map(s => s.src) // 文字列の配列
  };

  /* ========= 共通UI ========= */
  const isi_gray = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div style="width:100vw;height:100vh;background:rgb(128,128,128);"></div>',
    choices: "NO_KEYS",
    trial_duration: ISI_MS
  };

  // キー割当（表示用）
  const KEY_LABEL_MAP = {
    "1": "怒り",
    "2": "悲しみ",
    "3": "嫌悪",
    "4": "恐れ",
    "5": "驚き",
    "6": "喜び",
    "7": "無表情"
  };

  // 表情(英語) → 正解キー
  const EXP_TO_KEY = {
    angry: "1",
    sad: "2",
    disgust: "3",
    fear: "4",
    surprise: "5",
    happy: "6",
    neutral: "7"
  };

  /* ========= タイムライン ========= */
  const timeline = [preload];

  // 説明
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    choices: "ALL_KEYS",
    stimulus: `
      <div style="height:100vh;display:flex;align-items:center;justify-content:center;">
        <div class="ins" style="max-width:900px;line-height:1.9;font-size:18px;text-align:left;padding:24px;">
          <h2>実験の説明</h2>
          <ul>
            <li>本研究は、人が顔の表情を見て感情を判断する際の認知過程を明らかにすることを目的としています。</li>
            <li>具体的には、パソコン画面に表示される人物の顔画像を見て、その表情が示す感情をできるだけ速く・正確に判断していただきます。</li>
            <li>画面中央に人物の顔画像が1枚ずつ提示されます。画像を見たら、感じ取った感情に対応する数字キーを押して回答してください。</li>
            <li>表情から「怒り・悲しみ・嫌悪・恐れ・驚き・喜び・無表情」のいずれかを推測してください。</li>
          </ul>
          <h2>回答方法</h2>
          <ul style="padding-left:2em; list-style-position:outside; margin-left:0;">
            <li>感じ取った感情について，該当する数字キーをできるだけ速く押してください。</li>
            <li>数字キーは「1=怒り／2=悲しみ／3=嫌悪／4=恐れ／5=驚き／6=喜び／7=無表情」になります。</li>
            <li>全体は4ブロックで構成され、各ブロックの間に休憩を挟みます。所要時間は約15分になります。</li>
          </ul>
          <h2>実験環境</h2>
          <ul style="padding-left:2em; list-style-position:outside; margin-left:0;">
            <li>この実験はパソコン上で行います。以下の条件を満たすようにしてください。スマートフォンでは行えないので注意してください</li>
            <li>条件①：使用ブラウザはGoogle Chromeにしてください。</li>
            <li>条件②：フルスクリーン表示が推奨になります。フルスクリーン表示にしてください。</li>
            <li>条件③：普段メガネやコンタクトを使用している方は、そのまま着用してください。強い色覚異常がある場合、結果に影響する可能性があります。</li>
          <div style="margin-top:20px;text-align:center;color:#666;font-size:14px;">
            何かキーを押すと開始します
          </div>
        </div>
      </div>`
  });

// === ループの外：共通の試行テンプレート ===
const trial_template = {
  timeline: [
    isi_gray,
    {
      type: jsPsychHtmlKeyboardResponse,
      // ここは関数にしない。事前に作った HTML をそのまま使う
      stimulus: jsPsych.timelineVariable('html'),
      choices: Object.keys(KEY_LABEL_MAP),
      response_ends_trial: true,
      data: {
        gender:        jsPsych.timelineVariable('gender'),
        expression:    jsPsych.timelineVariable('expression'),
        variant:       jsPsych.timelineVariable('variant'),
        image_bg:      jsPsych.timelineVariable('image_bg'),
        stimulus:      jsPsych.timelineVariable('src'),
        block:         jsPsych.timelineVariable('block'),
        trial_in_block:jsPsych.timelineVariable('trial_in_block'),
        correct_key:   jsPsych.timelineVariable('correct_key')
      },
      on_finish: (data) => {
        const resp = data.response == null ? null : String(data.response);
        data.choice_key   = resp;
        data.choice_label = resp ? (KEY_LABEL_MAP[resp] || null) : null;
        const ck = data.correct_key ? String(data.correct_key) : null;
        data.correct_key   = ck;
        data.correct_label = ck ? (KEY_LABEL_MAP[ck] || null) : null;
        data.correct       = (resp != null && ck != null)
                              ? jsPsych.pluginAPI.compareKeys(resp, ck)
                              : false;
      }
    }
  ]
};

  // ブロック
  for (let b = 0; b < N_BLOCKS; b++) {

    // ブロック内の刺激（5枚×REPEATS_PER_IMAGE）
    let blockSlice = [];
    for (let r = 0; r < REPEATS_PER_IMAGE; r++) blockSlice = blockSlice.concat(baseImages);
    blockSlice = jsPsych.randomization.shuffle(blockSlice);

    // ブロック開始案内
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      choices: "ALL_KEYS",
      stimulus: `
        <div style="height:100vh;display:flex;align-items:center;justify-content:center;">
          <div style="text-align:center;max-width:800px;padding:24px;">
            <div style="font-size:22px;font-weight:700;margin-bottom:12px;">
              ブロック ${b+1} / ${N_BLOCKS}
            </div>
            <p>これから画像が表示されます。準備はいいですか？</p>
            <p style="margin-top:12px;color:#666;">続けるには何かキーを押してください</p>
          </div>
        </div>`
    });

    const tvars = blockSlice.map((s, i) => ({
     src: String(s.src),
     gender: s.gender || null,
     expression: s.expression,
     variant: s.variant,
     image_bg: s.image_bg,
     block: b + 1,
     trial_in_block: i + 1,
     correct_key: EXP_TO_KEY[s.expression] || null,
     html: `
       <div style="width:100vw;height:100vh;background:rgb(128,128,128);">
       <div class="stimulus-center">
         <img src="${s.src}" alt="stimulus"
             onerror="console.error('IMG-ERROR cannot load:', this.src)" />
       </div>
       </div>
       <div class="key-help"><div>
        1=怒り・2=悲しみ・3=嫌悪・4=恐れ・5=驚き・6=喜び・7=無表情
       </div></div>
  `
}));
console.log('[DEBUG] example tvars item:', tvars[0]);

timeline.push({
  timeline: [trial_template],
  timeline_variables: tvars,
  randomize_order: false
});

    // ブロック間休憩
    if (b < N_BLOCKS - 1) {
      timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        choices: "ALL_KEYS",
        stimulus: `
          <div style="height:100vh;display:flex;align-items:center;justify-content:center;">
            <div style="text-align:center;max-width:800px;padding:24px;">
              <div style="font-size:22px;font-weight:700;margin-bottom:12px;">休憩</div>
              <p>次のブロック（${b+2}/${N_BLOCKS}）に進む準備ができたら何かキーを押してください。</p>
            </div>
          </div>`
      });
    }
  }

  /* ========= 実行 ========= */
  jsPsych.run(timeline);
})();