import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-blue-800/30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">FV</span>
            </div>
            <span className="text-white font-bold text-xl">OneFTV</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Organize World-Class Footvolley Tournaments
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Manage King of the Beach and bracket tournaments globally. Automatic group generation, smart scheduling, and real-time rankings for athletes worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              Create Tournament
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 border-2 border-blue-400 text-blue-300 rounded-lg font-bold text-lg hover:bg-blue-400/10 transition-all"
            >
              View Rankings
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-cyan-300 mb-2">500+</div>
            <div className="text-slate-300 text-lg font-semibold">Active Athletes</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-cyan-300 mb-2">100+</div>
            <div className="text-slate-300 text-lg font-semibold">Tournaments Organized</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-cyan-300 mb-2">20+</div>
            <div className="text-slate-300 text-lg font-semibold">Countries</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V6.5m-11-3v3m4-3v3m4-3v3M3.5 9.5h13" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">King of the Beach</h3>
            <ul className="text-slate-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>Automatic group generation and rotation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>Dynamic rotating partners system</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>Individual performance rankings</span>
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h3a1 1 0 000-2 2 2 0 01-2-2V3a1 1 0 10-2 0v1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 00-2 0zm6 7a1 1 0 11-2 0 1 1 0 012 0zm2 0a1 1 0 11-2 0 1 1 0 012 0zm2 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Smart Scheduling</h3>
            <ul className="text-slate-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>AI-optimized court usage algorithms</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>Multi-court and multi-day support</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>Automatic conflict resolution</span>
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Global Rankings</h3>
            <ul className="text-slate-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>Cross-tournament performance tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>Player evolution and stats visualization</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">â€¢</span>
                <span>Real-time leaderboards and metrics</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl my-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: 1, title: 'Create Tournament', desc: 'Set up your tournament with venue, dates, and format' },
            { step: 2, title: 'Register Athletes', desc: 'Athletes register and join your tournament easily' },
            { step: 3, title: 'Generate Schedule', desc: 'AI creates optimal brackets and court assignments' },
            { step: 4, title: 'Track Results', desc: 'Update scores and watch rankings update live' },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">{item.step}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tournament Formats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">Tournament Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 border border-blue-400/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">King of the Beach (KotB)</h3>
            <p className="text-slate-300 mb-4">
              Perfect for continuous play throughout the event. Players rotate partners dynamically, creating unpredictable matchups and fostering camaraderie. Ideal for community tournaments.
            </p>
            <ul className="text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                Automatic partner rotation
              </li>
              <li className="flex items-center gap-2">
                <span class="w-2 h-2 bg-cyan-400 rounded-full"></span>
                Individual skill tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                Continuous tournament flow
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/50 border border-blue-400/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Bracket Tournaments</h3>
            <p className="text-slate-300 mb-4">
              Traditional single or double elimination format. Teams compete through structured rounds until champions are crowned. Perfect for competitive events and championships.
            </p>
            <ul className="text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className=‰Ü´È ´È‰œµå…¸´ÐÀÀÉ½Õ¹‘•µ™Õ±°ˆøð½ÍÁ…¸ø(€€€€€€€€€€€€€€€M¥¹±”½È‘½Õ‰±”•±¥µ¥¹…Ñ¥½¸(€€€€€€€€€€€€€€ð½±¤ø(€€€€€€€€€€€€€€ñ±¤±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´Èˆø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ü´È ´È‰œµå…¸´ÐÀÀÉ½Õ¹‘•µ™Õ±°ˆøð½ÍÁ…¸ø(€€€€€€€€€€€€€€€Q•…´µ‰…Í•½µÁ•Ñ¥Ñ¥½¹Ì(€€€€€€€€€€€€€€ð½±¤ø(€€€€€€€€€€€€€€ñ±¤±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´Èˆø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ö'rÓ"‚Ó"&rÖ7–âÓC&÷VæFVBÖgVÆÂ#ãÂ÷7ãà¢6ÆV"6†×–öâFWFW&Ö–æF–öà¢ÂöÆ“à¢Â÷VÃà¢ÂöF—cà ¢ÆF—b6Æ74æÖSÒ&&r×6ÆFRÓƒóS&÷&FW"&÷&FW"Ö&ÇVRÓCó#&÷VæFVB×†ÂÓ‚#à¢Æƒ26Æ74æÖSÒ'FW‡BÓ'†ÂföçBÖ&öÆBFW‡B×v†—FRÖ"ÓB#äw&÷W²¶æö6¶÷WCÂöƒ3à¢Ç6Æ74æÖSÒ'FW‡B×6ÆFRÓ3Ö"ÓB#à¢6öÖ&–æRF†R&W7Böb&÷F‚v÷&ÆG2âFV×26ö×WFR–âw&÷W7FvW2föÆÆ÷vVB'’¶æö6¶÷WB&÷VæG2âVç7W&W2f—"6ö×WF—F–öâæBW†6—F–ærf–æÇ2à¢Â÷à¢ÇVÂ6Æ74æÖSÒ'FW‡B×6ÆFRÓ376R×’Ó"#à¢ÆÆ’6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"#à¢Ç7â6Æ74æÖSÒ'rÓ"‚Ó"&rÖ7–âÓC&÷VæFVBÖgVÆÂ#ãÂ÷7ãà¢w&÷W7FvRVÆ–f–6F–öà¢ÂöÆ“à¢ÆÆ’6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"#à¢Ç7â6Æ74æÖSÒ'rÓ"‚Ó"&rÖ7–âÓC&÷VæFVBÖgVÆÂ#ãÂ÷7ãà¢¶æö6¶÷WBf–æÇ0¢ÂöÆ“à¢ÆÆ’6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"#à¢Ç7â6Æ74æÖSÒ'rÓ"‚Ó"&rÖ7–âÓC&÷VæFVBÖgVÆÂ#ãÂ÷7ãà¢f—"6VVF–ær7—7FVÐ¢ÂöÆ“à¢Â÷VÃà¢ÂöF—cà ¢ÆF—b6Æ74æÖSÒ&&r×6ÆFRÓƒóS&÷&FW"&÷&FW"Ö&ÇVRÓCó#&÷VæFVB×†ÂÓ‚#à¢Æƒ26Æ74æÖSÒ'FW‡BÓ'†ÂföçBÖ&öÆBFW‡B×v†—FRÖ"ÓB#å&÷VæB&ö&–ãÂöƒ3à¢Ç6Æ74æÖSÒ'FW‡B×6ÆFRÓ3Ö"ÓB#à¢WfW'’FVÒÆ—2WfW'’÷F†W"FVÒâW&fV7Bf÷"FWFW&Ö–æ–ærG'VR6¶–ÆÂÆWfVÇ2æBf—"&æ¶–æw2âw&VBf÷"ÆVwVR×7G–ÆRF÷W&æÖVçG2à¢Â÷à¢ÇVÂ6Æ74æÖSÒ'FW‡B×6ÆFRÓ376R×’Ó"#à¢ÆÆ’6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"#à¢Ç7â6Æ74æÖSÒ'rÓ"‚Ó"&rÖ7–âÓC&÷VæFVBÖgVÆÂ#ãÂ÷7ãà¢6ö×ÆWFRÆ–W"6÷fW&vP¢ÂöÆ“à¢ÆÆ’6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"#à¢Ç7â6Æ74æÖSÒ'rÓ"‚Ó"&rÖ7–âÓC&÷VæFVBÖgVÆÂ#ãÂ÷7ãà¢67W&FR&æ¶–æw0¢ÂöÆ“à¢ÆÆ’6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"#à¢Ç7â6Æ74æÖSÒ'rÓ"‚Ó"&rÖ7–âÓC&÷VæFVBÖgVÆÂ#ãÂ÷7ãà¢W‡FVæFVBF÷W&æÖVçBGW&F–öà¢ÂöÆ“à¢Â÷VÃà¢ÂöF—cà¢ÂöF—cà¢Â÷6V7F–öãà ¢²ò¢5D6V7F–öâ¢÷Ð¢Ç6V7F–öâ6Æ74æÖSÒ&Ö‚×rÓG†Â×‚ÖWFò‚ÓB6Ó§‚ÓbÆs§‚Ó‚’Ó##à¢ÆF—b6Æ74æÖSÒ&&rÖw&F–VçB×Fò×"g&öÒÖ&ÇVRÓcó#FòÖ7–âÓcó#&÷&FW"&÷&FW"Ö&ÇVRÓCóC&÷VæFVBÓ'†ÂÓ"FW‡BÖ6VçFW"#à¢Æƒ"6Æ74æÖSÒ'FW‡BÓG†ÂföçBÖ&öÆBFW‡B×v†—FRÖ"Ób#å&VG’Fò÷&væ—¦R–÷W"F÷W&æÖVçCóÂöƒ#à¢Ç6Æ74æÖSÒ'FW‡B×†ÂFW‡B×6ÆFRÓ3Ö"Ó‚#à¢¦ö–â‡VæG&VG2öb÷&væ—¦W'2Öæv–ærv÷&ÆBÖ6Æ72fö÷GföÆÆW’F÷W&æÖVçG0¢Â÷à¢ÄÆ–æ°¢‡&VcÒ"÷&Vv—7FW" ¢6Æ74æÖSÒ&–æÆ–æRÖ&Æö6²‚Ó‚’ÓB&rÖw&F–VçB×Fò×"g&öÒÖ&ÇVRÓSFòÖ7–âÓCFW‡B×6ÆFRÓ“&÷VæFVBÖÆrföçBÖ&öÆBFW‡BÖÆr†÷fW#§6†F÷rÖÆr†÷fW#§6†F÷rÖ&ÇVRÓSóSG&ç6—F–öâÖÆÂ†÷fW#§66ÆRÓR ¢à¢vWB7F'FVBg&VP¢ÂôÆ–æ³à¢ÂöF—cà¢Â÷6V7F–öãà ¢²ò¢fö÷FW"¢÷Ð¢Æfö÷FW"6Æ74æÖSÒ&&÷&FW"×B&÷&FW"Ö&ÇVRÓƒó3×BÓ#’Ó"#à¢ÆF—b6Æ74æÖSÒ&Ö‚×rÓw†Â×‚ÖWFò‚ÓB6Ó§‚ÓbÆs§‚Ó‚#à¢ÆF—b6Æ74æÖSÒ&w&–Bw&–BÖ6öÇ2ÓÖC¦w&–BÖ6öÇ2ÓBvÓ‚Ö"Ó‚#à¢ÆF—cà¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"Ö"ÓB#à¢ÆF—b6Æ74æÖSÒ'rÓ‚‚Ó‚&rÖw&F–VçB×FòÖ'"g&öÒÖ&ÇVRÓCFòÖ7–âÓ3&÷VæFVBÖÆrfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"#à¢Ç7â6Æ74æÖSÒ'FW‡B×6ÆFRÓ“föçBÖ&öÆBFW‡B×6Ò#ãeEcÂ÷7ãà¢ÂöF—cà¢Ç7â6Æ74æÖSÒ'FW‡B×v†—FRföçBÖ&öÆB#äöæTeEcÂ÷7ãà¢ÂöF—cà¢Ç6Æ74æÖSÒ'FW‡B×6ÆFRÓC#åF÷W&æÖVçBÖævVÖVçBÖFR6–×ÆSÂ÷à¢ÂöF—cà¢ÆF—cà¢ÆƒB6Æ74æÖSÒ'FW‡B×v†—FRföçBÖ&öÆBÖ"ÓB#å&öGV7CÂöƒCà¢ÇVÂ6Æ74æÖSÒ'76R×’Ó"FW‡B×6ÆFRÓC#à¢ÆÆ“ãÆ‡&VcÒ"2"6Æ74æÖSÒ&†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#äfVGW&W3ÂöãÂöÆ“à¢ÆÆ“ãÆ‡&VcÒ"2"6Æ74æÖSÒ&†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#å&–6–æsÂöãÂöÆ“à¢ÆÆ“ãÆ‡&VcÒ"2"6Æ74æÖSÒ&†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#ä“ÂöãÂöÆ“à¢Â÷VÃà¢ÂöF—cà¢ÆF—cà¢ÆƒB6Æ74æÖSÒ'FW‡B×v†—FRföçBÖ&öÆBÖ"ÓB#ä6ö×ç“ÂöƒCà¢ÇVÂ6Æ74æÖSÒ'76R×’Ó"FW‡B×6ÆFRÓC#à¢ÆÆ“ãÆ‡&VcÒ"2"6Æ74æÖSÒ&†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#ä&÷WCÂöãÂöÆ“à¢ÆÆ“ãÆ‡&VcÒ"2"6Æ74æÖSÒ&†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#ä&ÆösÂöãÂöÆ“à¢ÆÆ“ãÆ‡&VcÒ"2"6Æ74æÖSÒ&†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#ä6öçF7CÂöãÂöÆ“à¢Â÷VÃà¢ÂöF—cà¢ÆF—cà¢ÆƒB6Æ74æÖSÒ'FW‡B×v†—FRföçBÖ&öÆBÖ"ÓB#äÆVvÃÂöƒCà¢ÇVÂ6Æ74æÖSÒ'76R×’Ó"FW‡B×6ÆFRÓC#à¢ÆÆ“ãÆ‡&VcÒ"2"6Æ74æÖSÒ&†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#å&—f7“ÂöãÂöÆ“à¢ÆÆ“ãÆ‡&VcÒ"2"6Æ74æÖSÒ&†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#åFW&×3ÂöãÂöÆ“à¢Â÷VÃà¢ÂöF—cà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&&÷&FW"×B&÷&FW"Ö&ÇVRÓƒó3BÓ‚FW‡BÖ6VçFW"FW‡B×6ÆFRÓC#à¢Çâf6÷“²##BöæTeEbâÆÂ&–v‡G2&W6W'fVBãÂ÷à¢ÂöF—cà¢ÂöF—cà¢Âöfö÷FW#à¢ÂöF—cà¢ ðNø£cRö9EZfW7”¥&DdU¬à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâÖ"Ó‚#à¢ÆF—cà¢Æƒ6Æ74æÖSÒ'FW‡BÓ7†ÂföçBÖ&öÆBFW‡BÖw&’Ó“#åF÷W&æÖVçG3Âöƒà¢ÂöF—cà¢ÂöF—cà¢ÂöF—cà¢“°§Ð