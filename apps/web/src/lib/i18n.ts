export type Language = "en" | "ja"

export const translations = {
  en: {
    header: {
      title: "Sales Copilot",
      subtitle: "Real Estate Sales Assistant",
    },
    callDuration: "Call Duration",
    liveTranscript: "Live Transcript",
    recording: "Recording",
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    microphoneControl: "Microphone Control",
    activelyListening: "Actively listening to conversation...",
    readyToStart: "Ready to start recording",
    conversationStage: "CONVERSATION STAGE",
    identifiedConcerns: "IDENTIFIED CONCERNS",
    suggestedResponse: "SUGGESTED RESPONSE",
    whyThisResponse: "WHY THIS RESPONSE",
    aiAnalyzing: "AI actively analyzing...",
    readyToStart2: "Ready to start",
    noConcerns: "No concerns identified yet",
    noConversation: "Click Start Recording to begin capturing the conversation",
    waitingForConversation: "Waiting for conversation to begin...",
    analysisWillAppear: "Analysis will appear here",
    exchanges: "exchanges captured",
    noExchanges: "No conversation yet",
    sales_copilot: "Real Estate Sales Copilot",
    ai_powered_guidance: "AI-Powered Real-Time Sales Guidance",
    sales_agent: "Sales Agent",
    agent_desc: "Access real-time AI guidance, customer analysis, and recommended next steps",
    customer: "Customer",
    customer_desc: "Join a call with our sales agent",
    launch: "Launch",
    select_role: "Select your role above to begin",
    call_in_progress: "Call in Progress",
    call_connected: "Connected",
    call_ended: "Call Ended",
    thank_you: "Thank you for speaking with us",
    real_estate_agent: "Real Estate Agent",
    end_call: "End Call",
    copilot_powered: "Real Estate Sales Copilot",
    speaker: "Speaker",
    microphone: "Microphone",
    call_id_label: "Call ID (optional)",
    call_id_placeholder: "Enter call ID to join existing call",
    empty_starts_new: "Leave empty to start a new call",
    cancel: "Cancel",
    continue: "Continue",
    call_id_info: "Both users will share the same call ID to connect in real-time",
    stages: {
      initial_contact: "Initial Contact",
      qualification: "Qualification",
      presentation: "Presentation",
      objection_handling: "Objection Handling",
      closing: "Closing",
    },
    conversations: {
      scenario1: {
        messages: [
          {
            speaker: "Agent",
            text: "Good morning! Thanks for calling us today. How can I help you find your perfect home?",
          },
          {
            speaker: "Client",
            text: "Hi, we're looking for a 3-bedroom house in the downtown area, preferably with a yard.",
          },
          {
            speaker: "Agent",
            text: "That's great! Downtown has some excellent properties right now. What's your budget range?",
          },
          { speaker: "Client", text: "We're looking to spend around $500k to $600k." },
          {
            speaker: "Agent",
            text: "Perfect! We have several properties in that range. Are you currently in a position to make a move soon?",
          },
          { speaker: "Client", text: "Yes, we'd like to move within the next 2-3 months." },
          {
            speaker: "Agent",
            text: "Excellent! Let me show you 3 properties that match your criteria. They're all in prime downtown locations with excellent yard spaces.",
          },
          { speaker: "Client", text: "That sounds great! What's the process from here?" },
          { speaker: "Agent", text: "I can schedule viewings for this weekend. Does Saturday work for you?" },
          { speaker: "Client", text: "Saturday works perfectly. What time?" },
        ],
        analysis: {
          concerns: ["Budget constraints", "Location preference", "Moving timeline"],
          stage: "Presentation",
          talkExample:
            "Let me show you 3 properties that match your criteria perfectly. They're all in prime downtown locations with excellent yard spaces and modern amenities.",
          explanation:
            "Client has clear preferences and budget. Highlighting specific matches builds confidence and moves toward scheduling viewings.",
        },
      },
      scenario2: {
        messages: [
          { speaker: "Agent", text: "Hello! This is Sarah from Premier Realty. Am I speaking with the Johnsons?" },
          { speaker: "Client", text: "Yes, this is John. Thanks for calling back." },
          {
            speaker: "Agent",
            text: "Great! I wanted to follow up on the property listing you inquired about on Maple Street. Do you have a few minutes?",
          },
          { speaker: "Client", text: "Sure, I'm interested in that property but have some concerns about the price." },
          {
            speaker: "Agent",
            text: "I completely understand. What specific concerns do you have about the valuation?",
          },
          { speaker: "Client", text: "It seems high compared to similar homes in the neighborhood." },
          {
            speaker: "Agent",
            text: "That's a fair point. Let me explain why this property is priced competitively. It has recent renovations, a modern kitchen, and energy-efficient systems.",
          },
          { speaker: "Client", text: "I didn't realize about the renovations. Can you tell me more?" },
          {
            speaker: "Agent",
            text: "The kitchen was updated 6 months ago with stainless steel appliances, and the HVAC system is brand new. Would you like to schedule a viewing?",
          },
          { speaker: "Client", text: "Yes, I think we should see it in person." },
        ],
        analysis: {
          concerns: ["Price concerns", "Valuation clarity", "Recent improvements unknown"],
          stage: "Objection Handling",
          talkExample:
            "That's a fair point. Let me explain why this property is priced competitively. It has recent renovations worth $50k, a modern kitchen, and energy-efficient systems that will save you money long-term.",
          explanation:
            "Successfully addressing price objection by highlighting specific value-adds. Client is moving toward acceptance and ready for viewing.",
        },
      },
      scenario3: {
        messages: [
          {
            speaker: "Agent",
            text: "Hi! Thanks for reaching out. I saw you viewed the oceanfront property. What are your initial thoughts?",
          },
          {
            speaker: "Client",
            text: "We love the location and the views are amazing, but we're concerned about maintenance costs.",
          },
          { speaker: "Agent", text: "Oceanfront properties do require attention. What specifically concerns you?" },
          { speaker: "Client", text: "Salt water corrosion, weather damage, and ongoing upkeep seem expensive." },
          {
            speaker: "Agent",
            text: "Those are valid considerations. However, this property has been recently updated with salt-resistant materials and protective coatings.",
          },
          { speaker: "Client", text: "That's helpful to know. What would typical annual maintenance look like?" },
          {
            speaker: "Agent",
            text: "About $3,000-$4,000 annually for professional maintenance. Many owners find the lifestyle benefits worth the investment.",
          },
          { speaker: "Client", text: "That's reasonable. When can we close if we decide to move forward?" },
          {
            speaker: "Agent",
            text: "We can close within 30-45 days with proper financing. Would you like to make an offer?",
          },
          { speaker: "Client", text: "Let us think about it and we'll call you back." },
        ],
        analysis: {
          concerns: ["Maintenance costs", "Weather durability", "Long-term expenses"],
          stage: "Closing",
          talkExample:
            "I understand your concerns. This property has been recently updated with salt-resistant materials and protective coatings. Annual maintenance is typically $3,000-$4,000, and many owners find the lifestyle benefits worth the investment.",
          explanation:
            "Successfully addressed maintenance concerns with specific data. Client moving toward decision-making phase and interested in timeline.",
        },
      },
    },
  },
  ja: {
    header: {
      title: "営業コパイロット",
      subtitle: "不動産営業アシスタント",
    },
    callDuration: "通話時間",
    liveTranscript: "ライブトランスクリプト",
    recording: "録音中",
    startRecording: "録音開始",
    stopRecording: "録音停止",
    microphoneControl: "マイク制御",
    activelyListening: "会話を積極的にリッスン中...",
    readyToStart: "録音を開始する準備ができています",
    conversationStage: "会話ステージ",
    identifiedConcerns: "特定された懸念事項",
    suggestedResponse: "推奨される応答",
    whyThisResponse: "この応答が有効な理由",
    aiAnalyzing: "AI分析中...",
    readyToStart2: "開始準備完了",
    noConcerns: "懸念事項は特定されていません",
    noConversation: "録音を開始して会話のキャプチャを開始してください",
    waitingForConversation: "会話の開始を待っています...",
    analysisWillAppear: "ここに分析が表示されます",
    exchanges: "件の会話が取得されました",
    noExchanges: "会話はまだありません",
    sales_copilot: "不動産営業コパイロット",
    ai_powered_guidance: "AI搭載のリアルタイム営業ガイダンス",
    sales_agent: "営業エージェント",
    agent_desc: "リアルタイムAIガイダンス、顧客分析、推奨される次のステップにアクセス",
    customer: "顧客",
    customer_desc: "営業担当者との通話に参加",
    launch: "起動",
    select_role: "上記のロールを選択して開始してください",
    call_in_progress: "通話中",
    call_connected: "接続されています",
    call_duration: "通話時間",
    call_ended: "通話終了",
    thank_you: "お電話ありがとうございました",
    real_estate_agent: "不動産営業担当者",
    end_call: "通話を終了",
    copilot_powered: "不動産営業コパイロット",
    speaker: "スピーカー",
    microphone: "マイク",
    call_id_label: "通話ID（オプション）",
    call_id_placeholder: "既存通話に参加するには通話IDを入力してください",
    empty_starts_new: "空白のままにして新しい通話を開始してください",
    cancel: "キャンセル",
    continue: "続行",
    call_id_info: "両ユーザーは同じ通話IDを共有してリアルタイムで接続します",
    stages: {
      initial_contact: "初回コンタクト",
      qualification: "条件確認",
      presentation: "提案",
      objection_handling: "異議対応",
      closing: "クロージング",
    },
    conversations: {
      scenario1: {
        messages: [
          {
            speaker: "Agent",
            text: "おはようございます。本日はお電話いただきありがとうございます。理想のお住まい探しのお手伝いができることはありますか？",
          },
          {
            speaker: "Client",
            text: "こんにちは、ダウンタウンエリアで3ベッドルームの家を探していて、できれば庭がある物件がいいです。",
          },
          {
            speaker: "Agent",
            text: "素晴らしい！ダウンタウンには現在、素晴らしい物件がいくつかあります。予算の範囲はどのくらいですか？",
          },
          { speaker: "Client", text: "50万ドルから60万ドルの範囲で探しています。" },
          {
            speaker: "Agent",
            text: "ぴったりですね。その予算帯には複数の物件があります。今すぐお引っ越しのご準備はできていますか？",
          },
          { speaker: "Client", text: "はい、今後2～3ヶ月以内にお引っ越ししたいと考えています。" },
          {
            speaker: "Agent",
            text: "素晴らしい！あなたの条件に合う3つの物件をお見せします。すべてダウンタウンの一等地にあり、素晴らしい庭のスペースがあります。",
          },
          { speaker: "Client", text: "素晴らしいですね。ここからのプロセスはどのようになりますか？" },
          { speaker: "Agent", text: "週末の内覧を手配することができます。土曜日はいかがですか？" },
          { speaker: "Client", text: "土曜日で完璧です。何時がいいですか？" },
        ],
        analysis: {
          concerns: ["予算制約", "立地の好み", "引っ越し予定時期"],
          stage: "提示",
          talkExample:
            "あなたの条件に完全に合う3つの物件をお見せします。すべてダウンタウンの一等地にあり、素晴らしい庭のスペースと最新の設備があります。",
          explanation:
            "顧客は明確な好みと予算を持っています。具体的なマッチングを強調することで信頼を構築し、内覧予約に進みます。",
        },
      },
      scenario2: {
        messages: [
          { speaker: "Agent", text: "こんにちは。プレミアリアルティのサラです。ジョンソン様ですか？" },
          { speaker: "Client", text: "はい、ジョンです。お電話ありがとうございます。" },
          {
            speaker: "Agent",
            text: "素晴らしい。メープル通りの物件について、ご質問いただいたリスティングのフォローアップをしたいのですが、時間がありますか？",
          },
          { speaker: "Client", text: "はい、その物件に興味があるのですが、価格についていくつか懸念があります。" },
          { speaker: "Agent", text: "承知しました。評価価格についてはどのようなご懸念がありますか？" },
          { speaker: "Client", text: "近隣の類似物件と比較して高いように見えます。" },
          {
            speaker: "Agent",
            text: "ご指摘ありがとうございます。この物件がなぜ競争力のある価格かをご説明します。最近のリノベーション、モダンキッチン、エネルギー効率の高いシステムがあります。",
          },
          { speaker: "Client", text: "リノベーションについて知りませんでした。詳しく教えていただけますか？" },
          {
            speaker: "Agent",
            text: "キッチンは6ヶ月前にステンレススチール製品でアップデートされ、HVACシステムは新しいものです。内覧をスケジュールしてみませんか？",
          },
          { speaker: "Client", text: "はい、実際に見に行くべきだと思います。" },
        ],
        analysis: {
          concerns: ["価格懸念", "評価の明確性", "最近の改良への認識不足"],
          stage: "異議対応",
          talkExample:
            "ご指摘ありがとうございます。この物件がなぜ競争力のある価格かをご説明します。5万ドル相当の最近のリノベーション、モダンキッチン、長期的に費用削減できるエネルギー効率システムがあります。",
          explanation:
            "価格異議への対応が成功し、具体的な付加価値を強調しました。顧客は受け入れに向かい、内覧の準備ができています。",
        },
      },
      scenario3: {
        messages: [
          {
            speaker: "Agent",
            text: "こんにちは。オーシャンフロントの物件をご覧いただいたようですね。初めてのご印象はいかがですか？",
          },
          { speaker: "Client", text: "ロケーションと景色は素晴らしいのですが、メンテナンス費用が心配です。" },
          {
            speaker: "Agent",
            text: "オーシャンフロント物件はメンテナンスが必要です。具体的にはどのようなことが心配ですか？",
          },
          { speaker: "Client", text: "塩水による腐食、天候による損傷、継続的な維持管理が高そうです。" },
          {
            speaker: "Agent",
            text: "ご指摘ありがとうございます。ただしこの物件は、最近、耐塩材と保護コーティングでアップデートされています。",
          },
          { speaker: "Client", text: "参考になります。年間のメンテナンスはどのくらいになりますか？" },
          {
            speaker: "Agent",
            text: "プロフェッショナルメンテナンスで年間3,000～4,000ドルです。多くのオーナーはそのライフスタイルの価値があると考えています。",
          },
          { speaker: "Client", text: "合理的ですね。進むことに決めた場合、いつクローズできますか？" },
          {
            speaker: "Agent",
            text: "適切な融資があれば、30～45日以内にクローズできます。オファーを提出されたいですか？",
          },
          { speaker: "Client", text: "検討させていただいて、後ほどお電話します。" },
        ],
        analysis: {
          concerns: ["メンテナンス費用", "天候耐久性", "長期費用"],
          stage: "クローズ",
          talkExample:
            "ご懸念は理解します。この物件は耐塩材と保護コーティングで最近アップデートされています。年間メンテナンスは通常3,000～4,000ドルで、多くのオーナーはそのライフスタイルの価値があると考えています。",
          explanation:
            "メンテナンス懸念に具体的なデータで対応しました。顧客は意思決定段階に移行し、タイムラインに関心を示しています。",
        },
      },
    },
  },
}
