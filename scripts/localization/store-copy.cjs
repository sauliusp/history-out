/* Human-authored localized marketing copy. Product data and file-format names stay unchanged. */
const locales = {
 en: {
  tag:'en',name:'English',path:'',savedView:'Website research',
  actual:'HistoryOut · Actual interface',actualHtml:'Actual downloaded HTML file',foot:'Free · No account · On your device',note:'Actual interface. Fictional browsing history for this demo.',
  columns:'Choose your<br>columns.',detail:'Keep the detail<br>you need.',hero:'Your chosen format. Ready to download.',download:'Actual downloaded file',
  promoTitle:'Export your<br>browser history.',promoDetail:'Choose dates, pages and columns.',promise:'Free. Local. No account.',formats:'CHOOSE YOUR FORMAT',formatNotes:['Ready for your spreadsheet.','Structured data for your workflow.','Readable history. Clickable links.'],
  scenes:[
   ['Export your browser history','Your history.<br><b>Your file.</b>','Export to CSV, JSON or HTML. Keep a useful file you can open, work with or share.',['CSV','JSON','HTML']],
   ['Make the file yours','Your dates.<br><b>Your detail.</b>','Choose a date range and the columns that belong in your export.',['Custom dates','Choose your columns']],
   ['Readable HTML, included','Export it.<br><b>Open it later.</b>','Keep a readable local file with clickable links. Revisit useful pages whenever you need them.',['Actual HTML download','Clickable links']],
   ['Keep the matching pages','Less noise.<br><b>Useful results.</b>','Search and filter before you export. Keep the pages that matter to your work.',['Title and URL search','Website filters']],
   ['Useful extras, included','Pick it up<br><b>tomorrow.</b>','Daily recaps and saved views help you revisit useful pages and repeat your export settings.',['Daily recap','Saved views']]
  ],

  changelog:'New in 2.2.0: use HistoryOut in Simplified Chinese, Spanish, German, Brazilian Portuguese, French or Japanese. The workspace, welcome and update pages, readable HTML exports, website and Store images are localized. English remains available. CSV headers, JSON field names, saved views, export settings and permissions remain compatible. The existing YouTube demo is unchanged.',
  description:`Export your browser history as CSV, JSON or readable HTML. Choose your dates, select your columns, and keep matching pages in a useful local file.

HistoryOut is free. No account, no subscription, and no uploads of your browsing history.

THREE USEFUL FORMATS
CSV: open and analyze your history in Excel, Google Sheets or another spreadsheet tool.
JSON: use structured records in scripts and workflows.
HTML: keep a readable file with clickable links, ready to open locally in a browser.

MAKE THE FILE YOURS
Choose a preset or custom date range. Search titles and URLs, filter by website, and select your columns. Optional fields include Domain and Timestamp. Keep every matching visit, or one row per URL for the latest matching visit to each page.

Optional URL cleanup removes query strings and fragments. It does not anonymize your history: titles and URL paths can still contain personal information.

PREVIEW, THEN DOWNLOAD
The preview shows up to 100 rows. Your downloaded file includes every match from the loaded result. Refresh to read new visits.

FREE AND LOCAL
HistoryOut reads available browser history when you choose Preview or export. It has no advertising, analytics or account requirement. It does not upload history to a server or delete browser history. Permissions stay history, storage and sidePanel.

USEFUL EXTRAS, INCLUDED
Daily recaps and a recent trail help you revisit useful pages. Save a named view to reuse dates, filters and export settings. Saved views remember settings on this device, not a permanent history archive.

HistoryOut works with history available to your current browser profile. It cannot recover deleted history or guarantee access to older account history. Visit counts describe navigation events, not time spent or productivity.

NOW IN SEVEN LANGUAGES
English, Simplified Chinese, Spanish, German, Brazilian Portuguese, French and Japanese. The interface follows your browser language. CSV headers and JSON field names stay compatible with existing workflows.

SUGGEST A FEATURE
Suggest an improvement or vote for an idea: https://historyout.featurebase.app/
The board is public and hosted by Featurebase. No browsing history or export settings are attached. Posting or commenting may require a separate Featurebase sign-in. Private help: sauliusthedev@gmail.com.

OPTIONAL SUPPORT
An optional contribution supports independent development: https://www.buymeacoffee.com/saulius.developer
Every feature stays free whether you contribute or not. Tell a friend copies the installation link for you to share.

Features, examples, browser options and release notes: https://exportchromehistory.app/`
 },
 zh_CN:{
  tag:'zh-CN',name:'中文（简体）',path:'zh-cn',savedView:'网站研究',actual:'HistoryOut · 实际界面',actualHtml:'实际下载的 HTML 文件',foot:'免费 · 无需账号 · 本地处理',note:'真实产品界面。演示使用虚构的浏览记录。',columns:'选择需要的<br>导出列。',detail:'只保留<br>需要的信息。',hero:'选择格式，即可下载。',download:'实际下载的文件',
  promoTitle:'导出你的<br>浏览记录。',promoDetail:'选择日期、网页和导出列。',promise:'免费。本地处理。无需账号。',formats:'选择导出格式',formatNotes:['在电子表格中打开和分析。','适用于脚本和工作流程的结构化数据。','清晰易读，链接可点击。'],
  scenes:[
   ['导出浏览记录','你的记录。<br><b>你的文件。</b>','导出为 CSV、JSON 或 HTML，保存为可打开、处理或分享的文件。',['CSV','JSON','HTML']],
   ['按需导出','你的日期。<br><b>你的细节。</b>','选择日期范围和导出列，只保留需要的信息。',['自定义日期','选择导出列']],
   ['包含易读的 HTML 格式','现在导出。<br><b>以后再看。</b>','保存带有可点击链接的本地文件，随时重访有用的网页。',['真实 HTML 下载','可点击的链接']],
   ['保留匹配的网页','减少干扰。<br><b>留下所需。</b>','先搜索和筛选，再导出与你工作相关的网页。',['搜索标题和网址','按网站筛选']],
   ['实用功能，全部免费','明天继续，<br><b>轻松接上。</b>','每日概览和已保存视图帮助你重访网页，并重复使用导出设置。',['每日概览','已保存视图']]
  ],
  changelog:'2.2.0 新增：支持简体中文、西班牙语、德语、巴西葡萄牙语、法语和日语。工作区、欢迎页、更新页、HTML 导出文件、网站和商店图片均已本地化，英语仍然可用。CSV 列名、JSON 字段名、已保存视图、导出设置和权限保持兼容。现有 YouTube 演示视频保持不变。',
  description:`将浏览记录导出为 CSV、JSON 或易读的 HTML 文件。选择日期和导出列，将匹配的网页保存在实用的本地文件中。

HistoryOut 完全免费。无需账号，无需订阅，也不会上传你的浏览记录。

三种实用格式
CSV：在 Excel、Google 表格或其他电子表格工具中打开并分析记录。
JSON：在脚本和工作流程中使用结构化记录。
HTML：保存清晰易读、带有可点击链接的文件，直接在浏览器中本地打开。

按需导出
使用预设日期范围或自定义日期。搜索网页标题和网址，按网站筛选，并选择需要的导出列。可选字段包括域名和时间戳。保留所有匹配的访问记录，或选择每个网址一行，仅保留每个网页最近一次匹配的访问。

可选的网址清理功能会移除查询参数和片段。这不会使浏览记录匿名化：网页标题和网址路径仍可能包含个人信息。

先预览，再下载
预览最多显示 100 行。下载文件包含已加载结果中所有匹配项。点击刷新可读取新的访问记录。

免费且在本地运行
只有选择预览或导出时，HistoryOut 才会读取可用的浏览记录。没有广告、分析追踪或账号要求。不会将记录上传到服务器，也不会删除浏览记录。权限仍为 history、storage 和 sidePanel。

实用功能，全部包含
每日概览和最近浏览轨迹帮助你重访有用的网页。保存命名视图，以便下次重复使用日期、筛选条件和导出设置。已保存视图仅在此设备上记住设置，不会建立永久的浏览记录存档。

HistoryOut 只能处理当前浏览器个人资料中可用的记录。无法恢复已删除的记录，也不保证能够访问账号中更早的历史记录。访问次数表示导航事件，不代表浏览时长或工作效率。

现已支持七种语言
英语、简体中文、西班牙语、德语、巴西葡萄牙语、法语和日语。界面跟随浏览器语言。CSV 列名和 JSON 字段名保持兼容，方便继续使用现有工作流程。

建议新功能
提出改进建议或为想法投票：https://historyout.featurebase.app/
该反馈看板由 Featurebase 托管并公开显示，不会附带浏览记录或导出设置。发布或评论可能需要单独登录 Featurebase。私人帮助请联系 sauliusthedev@gmail.com。

自愿支持
你可以自愿捐助独立开发：https://www.buymeacoffee.com/saulius.developer
无论是否捐助，所有功能均免费。“推荐给朋友”可复制安装链接，供你自行分享。

功能、示例、浏览器选项和更新说明：https://exportchromehistory.app/zh-cn/`
 },
 es:{
  tag:'es',name:'Español',path:'es',savedView:'Investigación web',actual:'HistoryOut · Interfaz real',actualHtml:'Archivo HTML descargado',foot:'Gratis · Sin cuenta · En tu dispositivo',note:'Interfaz real. Historial ficticio para esta demostración.',columns:'Elige tus<br>columnas.',detail:'Conserva los datos<br>que necesitas.',hero:'El formato que eliges. Listo para descargar.',download:'Archivo descargado real',
  promoTitle:'Exporta tu<br>historial web.',promoDetail:'Elige fechas, páginas y columnas.',promise:'Gratis. Local. Sin cuenta.',formats:'ELIGE TU FORMATO',formatNotes:['Listo para tu hoja de cálculo.','Datos estructurados para tu trabajo.','Historial legible. Enlaces accesibles.'],
  scenes:[
   ['Exporta tu historial web','Tu historial.<br><b>Tu archivo.</b>','Exporta a CSV, JSON o HTML. Guarda un archivo que puedas abrir, usar o compartir.',['CSV','JSON','HTML']],
   ['El archivo, a tu medida','Tus fechas.<br><b>Tus datos.</b>','Elige un intervalo de fechas y las columnas que quieres exportar.',['Fechas personalizadas','Elige tus columnas']],
   ['HTML legible, incluido','Expórtalo.<br><b>Ábrelo luego.</b>','Guarda un archivo local legible con enlaces. Vuelve a las páginas útiles cuando quieras.',['Descarga HTML real','Enlaces accesibles']],
   ['Guarda las páginas que buscas','Menos ruido.<br><b>Más utilidad.</b>','Busca y filtra antes de exportar. Conserva las páginas que necesitas para tu trabajo.',['Busca títulos y URL','Filtra por sitio web']],
   ['Extras útiles, incluidos','Continúa<br><b>mañana.</b>','Los resúmenes diarios y las vistas guardadas te ayudan a retomar páginas y repetir tus ajustes.',['Resumen diario','Vistas guardadas']]
  ],
  changelog:'Nuevo en 2.2.0: usa HistoryOut en chino simplificado, español, alemán, portugués de Brasil, francés o japonés. Hemos traducido el espacio de trabajo, las páginas de bienvenida y actualización, los archivos HTML, el sitio web y las imágenes de la tienda. El inglés sigue disponible. Se mantiene la compatibilidad de los encabezados CSV, los campos JSON, las vistas guardadas, los ajustes y los permisos. El vídeo de YouTube no cambia.',
  description:`Exporta tu historial de navegación a CSV, JSON o HTML legible. Elige fechas y columnas, y guarda las páginas que coincidan en un archivo local útil.

HistoryOut es gratis. Sin cuenta, sin suscripción y sin subir tu historial a ningún servidor.

TRES FORMATOS ÚTILES
CSV: abre y analiza tu historial en Excel, Google Sheets u otra hoja de cálculo.
JSON: usa registros estructurados en tus scripts y flujos de trabajo.
HTML: guarda un archivo legible con enlaces que puedes abrir localmente en el navegador.

EL ARCHIVO, A TU MEDIDA
Elige un intervalo de fechas predefinido o personalizado. Busca títulos y URL, filtra por sitio web y selecciona las columnas. Entre los campos opcionales están Dominio y Marca de tiempo. Conserva todas las visitas coincidentes o una fila por URL con la última visita coincidente a cada página.

La limpieza opcional de URL elimina parámetros de consulta y fragmentos. No anonimiza tu historial: los títulos y las rutas pueden contener información personal.

PREVISUALIZA Y DESCARGA
La vista previa muestra hasta 100 filas. El archivo descargado incluye todas las coincidencias de los resultados cargados. Actualiza para leer nuevas visitas.

GRATIS Y LOCAL
HistoryOut lee el historial disponible cuando eliges previsualizar o exportar. No tiene publicidad, analíticas ni exige una cuenta. No sube el historial a un servidor ni lo elimina del navegador. Mantiene los permisos history, storage y sidePanel.

EXTRAS ÚTILES, INCLUIDOS
Los resúmenes diarios y el recorrido reciente te ayudan a volver a páginas útiles. Guarda una vista con nombre para reutilizar fechas, filtros y ajustes de exportación. Las vistas guardadas recuerdan ajustes en este dispositivo, no crean un archivo permanente del historial.

HistoryOut usa el historial disponible en el perfil actual del navegador. No recupera visitas eliminadas ni garantiza acceso al historial antiguo de una cuenta. Los recuentos representan eventos de navegación, no tiempo de uso ni productividad.

AHORA EN SIETE IDIOMAS
Inglés, chino simplificado, español, alemán, portugués de Brasil, francés y japonés. La interfaz sigue el idioma del navegador. Los encabezados CSV y los nombres de campo JSON siguen siendo compatibles con tus flujos de trabajo.

SUGIERE UNA FUNCIÓN
Propón una mejora o vota una idea: https://historyout.featurebase.app/
El tablón es público y está alojado en Featurebase. No se adjuntan el historial ni los ajustes de exportación. Publicar o comentar puede requerir una cuenta de Featurebase. Ayuda privada: sauliusthedev@gmail.com.

APOYO OPCIONAL
Una aportación voluntaria apoya el desarrollo independiente: https://www.buymeacoffee.com/saulius.developer
Todas las funciones siguen siendo gratuitas, aportes o no. Recomendar a un amigo copia el enlace de instalación para que lo compartas.

Funciones, ejemplos, navegadores y notas de versión: https://exportchromehistory.app/es/`
 },
 de:{
  tag:'de',name:'Deutsch',path:'de',savedView:'Webrecherche',actual:'HistoryOut · Echte Oberfläche',actualHtml:'Tatsächlich heruntergeladene HTML-Datei',foot:'Kostenlos · Ohne Konto · Auf deinem Gerät',note:'Echte Oberfläche mit fiktivem Browserverlauf für diese Demo.',columns:'Wähle deine<br>Spalten.',detail:'Behalte die Details,<br>die du brauchst.',hero:'Dein gewähltes Format. Bereit zum Download.',download:'Tatsächlich heruntergeladene Datei',
  promoTitle:'Exportiere deinen<br>Browserverlauf.',promoDetail:'Wähle Zeitraum, Seiten und Spalten.',promise:'Kostenlos. Lokal. Ohne Konto.',formats:'WÄHLE DEIN FORMAT',formatNotes:['Bereit für deine Tabellenkalkulation.','Strukturierte Daten für deine Abläufe.','Lesbarer Verlauf. Anklickbare Links.'],
  scenes:[
   ['Exportiere deinen Browserverlauf','Dein Verlauf.<br><b>Deine Datei.</b>','Exportiere als CSV, JSON oder HTML. Speichere eine Datei zum Öffnen, Bearbeiten oder Teilen.',['CSV','JSON','HTML']],
   ['Die Datei nach deinen Wünschen','Dein Zeitraum.<br><b>Deine Details.</b>','Wähle den Zeitraum und die Spalten für deinen Export.',['Eigener Zeitraum','Spalten auswählen']],
   ['Lesbares HTML inklusive','Jetzt exportieren.<br><b>Später öffnen.</b>','Speichere eine lesbare lokale Datei mit Links. Kehre bei Bedarf zu nützlichen Seiten zurück.',['Echter HTML-Download','Anklickbare Links']],
   ['Passende Seiten behalten','Weniger Ablenkung.<br><b>Mehr Relevanz.</b>','Suche und filtere vor dem Export. Behalte die Seiten, die du für deine Arbeit brauchst.',['Titel und URLs suchen','Nach Website filtern']],
   ['Nützliche Extras inklusive','Morgen<br><b>weitermachen.</b>','Tagesübersichten und gespeicherte Ansichten helfen dir, Seiten und Exporteinstellungen wiederzuverwenden.',['Tagesübersicht','Gespeicherte Ansichten']]
  ],
  changelog:'Neu in 2.2.0: HistoryOut auf vereinfachtem Chinesisch, Spanisch, Deutsch, brasilianischem Portugiesisch, Französisch und Japanisch. Arbeitsbereich, Willkommens- und Aktualisierungsseiten, HTML-Exporte, Website und Store-Bilder sind übersetzt. Englisch bleibt verfügbar. CSV-Spaltennamen, JSON-Feldnamen, gespeicherte Ansichten, Exporteinstellungen und Berechtigungen bleiben kompatibel. Das bisherige YouTube-Video bleibt unverändert.',
  description:`Exportiere deinen Browserverlauf als CSV, JSON oder lesbares HTML. Wähle Zeitraum und Spalten und speichere passende Seiten in einer nützlichen lokalen Datei.

HistoryOut ist kostenlos. Ohne Konto, ohne Abo und ohne Upload deines Browserverlaufs.

DREI NÜTZLICHE FORMATE
CSV: Öffne und analysiere deinen Verlauf in Excel, Google Sheets oder einer anderen Tabellenkalkulation.
JSON: Nutze strukturierte Einträge in Skripten und Arbeitsabläufen.
HTML: Speichere eine lesbare Datei mit anklickbaren Links, die sich lokal im Browser öffnen lässt.

DIE DATEI NACH DEINEN WÜNSCHEN
Wähle einen voreingestellten oder eigenen Zeitraum. Suche nach Titeln und URLs, filtere nach Website und wähle deine Spalten. Optionale Felder sind Domain und Zeitstempel. Behalte jeden passenden Besuch oder eine Zeile pro URL mit dem letzten passenden Besuch jeder Seite.

Die optionale URL-Bereinigung entfernt Abfrageparameter und Fragmente. Sie anonymisiert den Verlauf nicht: Titel und URL-Pfade können weiterhin persönliche Informationen enthalten.

ERST VORSCHAU, DANN DOWNLOAD
Die Vorschau zeigt bis zu 100 Zeilen. Die heruntergeladene Datei enthält alle Treffer aus dem geladenen Ergebnis. Aktualisiere, um neue Besuche einzulesen.

KOSTENLOS UND LOKAL
HistoryOut liest den verfügbaren Verlauf, wenn du Vorschau oder Export wählst. Es gibt keine Werbung, Analysefunktionen oder Kontopflicht. Der Verlauf wird weder auf einen Server hochgeladen noch aus dem Browser gelöscht. Die Berechtigungen bleiben history, storage und sidePanel.

NÜTZLICHE EXTRAS INKLUSIVE
Tagesübersichten und die zuletzt besuchten Seiten erleichtern die Rückkehr zu nützlichen Inhalten. Speichere benannte Ansichten, um Zeitraum, Filter und Exporteinstellungen erneut zu verwenden. Gespeicherte Ansichten merken sich Einstellungen auf diesem Gerät, kein dauerhaftes Verlaufsarchiv.

HistoryOut arbeitet mit dem Verlauf des aktuellen Browserprofils. Gelöschter Verlauf lässt sich nicht wiederherstellen; ein Zugriff auf ältere Kontodaten wird nicht garantiert. Besuchszahlen zählen Navigationsereignisse, keine Nutzungsdauer oder Produktivität.

JETZT IN SIEBEN SPRACHEN
Englisch, vereinfachtes Chinesisch, Spanisch, Deutsch, brasilianisches Portugiesisch, Französisch und Japanisch. Die Oberfläche folgt der Browsersprache. CSV-Spaltennamen und JSON-Feldnamen bleiben mit bestehenden Abläufen kompatibel.

FUNKTION VORSCHLAGEN
Schlage Verbesserungen vor oder stimme für Ideen: https://historyout.featurebase.app/
Das öffentliche Feedback-Board wird von Featurebase betrieben. Verlauf und Exporteinstellungen werden nicht angehängt. Zum Schreiben oder Kommentieren kann eine separate Featurebase-Anmeldung nötig sein. Private Hilfe: sauliusthedev@gmail.com.

FREIWILLIGE UNTERSTÜTZUNG
Ein freiwilliger Beitrag unterstützt die unabhängige Entwicklung: https://www.buymeacoffee.com/saulius.developer
Alle Funktionen bleiben kostenlos, unabhängig von einer Spende. Mit der Weiterempfehlung kopierst du den Installationslink zum Teilen.

Funktionen, Beispiele, Browseroptionen und Versionshinweise: https://exportchromehistory.app/de/`
 },
 pt_BR:{
  tag:'pt-BR',name:'Português (Brasil)',path:'pt-br',savedView:'Pesquisa na web',actual:'HistoryOut · Interface real',actualHtml:'Arquivo HTML baixado de verdade',foot:'Grátis · Sem conta · No seu dispositivo',note:'Interface real. Histórico fictício para esta demonstração.',columns:'Escolha suas<br>colunas.',detail:'Mantenha os dados<br>de que precisa.',hero:'O formato que você escolheu. Pronto para baixar.',download:'Arquivo baixado de verdade',
  promoTitle:'Exporte seu<br>histórico web.',promoDetail:'Escolha datas, páginas e colunas.',promise:'Grátis. Local. Sem conta.',formats:'ESCOLHA SEU FORMATO',formatNotes:['Pronto para sua planilha.','Dados estruturados para seu trabalho.','Histórico legível. Links clicáveis.'],
  scenes:[
   ['Exporte seu histórico de navegação','Seu histórico.<br><b>Seu arquivo.</b>','Exporte em CSV, JSON ou HTML. Guarde um arquivo que você possa abrir, usar ou compartilhar.',['CSV','JSON','HTML']],
   ['O arquivo do seu jeito','Suas datas.<br><b>Seus detalhes.</b>','Escolha um período e as colunas que devem fazer parte da exportação.',['Datas personalizadas','Escolha suas colunas']],
   ['HTML legível, incluído','Exporte agora.<br><b>Abra depois.</b>','Guarde um arquivo local legível com links clicáveis. Volte às páginas úteis quando precisar.',['Download HTML real','Links clicáveis']],
   ['Guarde as páginas que procura','Menos ruído.<br><b>Mais utilidade.</b>','Busque e filtre antes de exportar. Mantenha as páginas importantes para seu trabalho.',['Busca por título e URL','Filtros por site']],
   ['Extras úteis, incluídos','Continue<br><b>amanhã.</b>','Resumos diários e visualizações salvas ajudam você a retomar páginas e reutilizar as configurações.',['Resumo diário','Visualizações salvas']]
  ],
  changelog:'Novidade na versão 2.2.0: use o HistoryOut em chinês simplificado, espanhol, alemão, português do Brasil, francês ou japonês. A interface, as páginas de boas-vindas e atualização, os arquivos HTML, o site e as imagens da loja foram traduzidos. O inglês continua disponível. Cabeçalhos CSV, campos JSON, visualizações salvas, configurações e permissões mantêm a compatibilidade. O vídeo do YouTube continua o mesmo.',
  description:`Exporte seu histórico de navegação em CSV, JSON ou HTML legível. Escolha datas e colunas e guarde as páginas correspondentes em um arquivo local útil.

O HistoryOut é grátis. Sem conta, sem assinatura e sem enviar seu histórico para servidores.

TRÊS FORMATOS ÚTEIS
CSV: abra e analise seu histórico no Excel, Google Planilhas ou outro aplicativo de planilhas.
JSON: use registros estruturados em scripts e fluxos de trabalho.
HTML: guarde um arquivo legível com links clicáveis para abrir localmente no navegador.

O ARQUIVO DO SEU JEITO
Escolha um período predefinido ou datas personalizadas. Busque títulos e URLs, filtre por site e selecione as colunas. Os campos opcionais incluem Domínio e Carimbo de data/hora. Mantenha todas as visitas correspondentes ou uma linha por URL com a última visita correspondente a cada página.

A limpeza opcional de URLs remove parâmetros de consulta e fragmentos. Isso não anonimiza o histórico: títulos e caminhos de URL ainda podem conter informações pessoais.

VISUALIZE E BAIXE
A prévia mostra até 100 linhas. O arquivo baixado inclui todos os resultados correspondentes que foram carregados. Atualize para ler novas visitas.

GRÁTIS E LOCAL
O HistoryOut lê o histórico disponível quando você escolhe visualizar ou exportar. Não tem anúncios, ferramentas de análise nem exige uma conta. Não envia o histórico para um servidor nem o apaga do navegador. As permissões continuam sendo history, storage e sidePanel.

EXTRAS ÚTEIS, INCLUÍDOS
Resumos diários e o histórico recente ajudam você a voltar a páginas úteis. Salve uma visualização com nome para reutilizar datas, filtros e configurações de exportação. As visualizações salvas guardam configurações neste dispositivo, não um arquivo permanente do histórico.

O HistoryOut usa o histórico disponível no perfil atual do navegador. Não recupera histórico excluído nem garante acesso a registros antigos da conta. As contagens representam eventos de navegação, não tempo de uso ou produtividade.

AGORA EM SETE IDIOMAS
Inglês, chinês simplificado, espanhol, alemão, português do Brasil, francês e japonês. A interface segue o idioma do navegador. Os cabeçalhos CSV e os nomes dos campos JSON permanecem compatíveis com seus fluxos de trabalho.

SUGIRA UMA FUNÇÃO
Sugira melhorias ou vote em ideias: https://historyout.featurebase.app/
O mural é público e hospedado no Featurebase. Nenhum histórico ou configuração de exportação é anexado. Publicar ou comentar pode exigir uma conta separada no Featurebase. Ajuda privada: sauliusthedev@gmail.com.

APOIO OPCIONAL
Uma contribuição voluntária apoia o desenvolvimento independente: https://www.buymeacoffee.com/saulius.developer
Todas as funções continuam grátis, com ou sem contribuição. Recomendar a um amigo copia o link de instalação para você compartilhar.

Funções, exemplos, opções de navegador e notas da versão: https://exportchromehistory.app/pt-br/`
 },
 fr:{
  tag:'fr',name:'Français',path:'fr',savedView:'Recherche sur le web',actual:'HistoryOut · Interface réelle',actualHtml:'Fichier HTML réellement téléchargé',foot:'Gratuit · Sans compte · Sur votre appareil',note:'Interface réelle. Historique fictif pour cette démonstration.',columns:'Choisissez vos<br>colonnes.',detail:'Gardez les détails<br>utiles.',hero:'Le format choisi. Prêt à télécharger.',download:'Fichier réellement téléchargé',
  promoTitle:'Exportez votre<br>historique web.',promoDetail:'Choisissez dates, pages et colonnes.',promise:'Gratuit. Local. Sans compte.',formats:'CHOISISSEZ VOTRE FORMAT',formatNotes:['Prêt pour votre tableur.','Des données structurées à exploiter.','Un historique lisible. Des liens cliquables.'],
  scenes:[
   ['Exportez votre historique web','Votre historique.<br><b>Votre fichier.</b>','Exportez en CSV, JSON ou HTML. Gardez un fichier à ouvrir, utiliser ou partager.',['CSV','JSON','HTML']],
   ['Le fichier à votre mesure','Vos dates.<br><b>Vos détails.</b>','Choisissez une période et les colonnes à inclure dans votre export.',['Dates personnalisées','Choix des colonnes']],
   ['HTML lisible inclus','Exportez.<br><b>Rouvrez plus tard.</b>','Gardez un fichier local lisible avec des liens cliquables. Retrouvez les pages utiles à tout moment.',['Vrai fichier HTML','Liens cliquables']],
   ['Gardez les pages recherchées','Moins de bruit.<br><b>Plus de pertinence.</b>','Recherchez et filtrez avant d’exporter. Gardez les pages utiles à votre travail.',['Titres et URL','Filtres par site']],
   ['Des fonctions utiles incluses','Reprenez<br><b>demain.</b>','Les récapitulatifs et les vues enregistrées vous aident à retrouver des pages et à réutiliser vos réglages.',['Récapitulatif du jour','Vues enregistrées']]
  ],
  changelog:'Nouveau dans la version 2.2.0 : utilisez HistoryOut en chinois simplifié, espagnol, allemand, portugais du Brésil, français ou japonais. L’interface, les pages d’accueil et de mise à jour, les exports HTML, le site et les images de la boutique sont traduits. L’anglais reste disponible. Les en-têtes CSV, champs JSON, vues enregistrées, réglages et autorisations restent compatibles. La vidéo YouTube ne change pas.',
  description:`Exportez votre historique de navigation en CSV, JSON ou HTML lisible. Choisissez vos dates et vos colonnes, puis conservez les pages correspondantes dans un fichier local utile.

HistoryOut est gratuit. Sans compte, sans abonnement et sans transfert de votre historique vers un serveur.

TROIS FORMATS UTILES
CSV : ouvrez et analysez votre historique dans Excel, Google Sheets ou un autre tableur.
JSON : utilisez des données structurées dans vos scripts et vos outils.
HTML : gardez un fichier lisible avec des liens cliquables, à ouvrir localement dans un navigateur.

LE FICHIER À VOTRE MESURE
Choisissez une période prédéfinie ou des dates personnalisées. Recherchez des titres et des URL, filtrez par site et sélectionnez les colonnes. Les champs facultatifs comprennent le domaine et l’horodatage. Gardez toutes les visites correspondantes ou une ligne par URL avec la dernière visite correspondante de chaque page.

Le nettoyage facultatif des URL supprime les paramètres de requête et les fragments. Il n’anonymise pas votre historique : les titres et les chemins des URL peuvent encore contenir des informations personnelles.

APERÇU, PUIS TÉLÉCHARGEMENT
L’aperçu affiche jusqu’à 100 lignes. Le fichier téléchargé contient toutes les correspondances des résultats chargés. Actualisez pour lire les nouvelles visites.

GRATUIT ET LOCAL
HistoryOut lit l’historique disponible lorsque vous choisissez l’aperçu ou l’export. Il ne contient ni publicité ni outil d’analyse et ne demande aucun compte. Il ne transfère pas votre historique à un serveur et ne l’efface pas du navigateur. Les autorisations restent history, storage et sidePanel.

DES FONCTIONS UTILES INCLUSES
Les récapitulatifs quotidiens et les pages récemment visitées vous aident à retrouver des contenus utiles. Enregistrez une vue nommée pour réutiliser dates, filtres et réglages d’export. Les vues enregistrées mémorisent des réglages sur cet appareil, pas une archive permanente de l’historique.

HistoryOut utilise l’historique disponible dans le profil actuel du navigateur. Il ne récupère pas les visites effacées et ne garantit pas l’accès aux anciens enregistrements d’un compte. Les compteurs représentent des événements de navigation, pas le temps passé ni la productivité.

DÉSORMAIS EN SEPT LANGUES
Anglais, chinois simplifié, espagnol, allemand, portugais du Brésil, français et japonais. L’interface suit la langue du navigateur. Les en-têtes CSV et les noms de champs JSON restent compatibles avec vos outils existants.

SUGGÉREZ UNE FONCTION
Proposez une amélioration ou votez pour une idée : https://historyout.featurebase.app/
Le tableau est public et hébergé par Featurebase. Aucun historique ni réglage d’export n’est joint. Publier ou commenter peut nécessiter une connexion distincte à Featurebase. Aide privée : sauliusthedev@gmail.com.

SOUTIEN FACULTATIF
Une contribution volontaire soutient le développement indépendant : https://www.buymeacoffee.com/saulius.developer
Toutes les fonctions restent gratuites, que vous contribuiez ou non. Recommander à un ami copie le lien d’installation pour vous permettre de le partager.

Fonctions, exemples, navigateurs et notes de version : https://exportchromehistory.app/fr/`
 },
 ja:{
  tag:'ja',name:'日本語',path:'ja',savedView:'ウェブ調査',actual:'HistoryOut · 実際の画面',actualHtml:'実際にダウンロードした HTML ファイル',foot:'無料 · アカウント不要 · 端末内で処理',note:'実際の画面です。デモには架空の閲覧履歴を使用しています。',columns:'必要な列を<br>選択。',detail:'必要な情報だけを<br>残せます。',hero:'選んだ形式で、すぐにダウンロード。',download:'実際にダウンロードしたファイル',
  promoTitle:'閲覧履歴を<br>エクスポート。',promoDetail:'日付、ページ、列を選べます。',promise:'無料。端末内で処理。アカウント不要。',formats:'形式を選択',formatNotes:['表計算ソフトで開いて分析。','スクリプトで使える構造化データ。','読みやすい履歴。クリックできるリンク。'],
  scenes:[
   ['閲覧履歴をエクスポート','あなたの履歴を。<br><b>あなたのファイルに。</b>','CSV、JSON、HTML で保存。開く、活用する、共有するためのファイルに。',['CSV','JSON','HTML']],
   ['必要な内容だけを保存','日付も。<br><b>項目も。</b>','期間とエクスポートする列を選び、必要な情報だけを保存できます。',['期間を指定','列を選択']],
   ['読みやすい HTML も標準搭載','今、保存して。<br><b>後で開く。</b>','リンク付きの読みやすいファイルを端末に保存。必要なページにいつでも戻れます。',['実際の HTML ファイル','クリックできるリンク']],
   ['条件に合うページだけを保存','余分を減らして。<br><b>必要な情報に。</b>','検索と絞り込みをしてから保存。作業に必要なページを残せます。',['タイトル・URL 検索','サイトで絞り込み']],
   ['便利な機能もすべて無料','明日も、<br><b>続きから。</b>','日ごとの概要と保存済みビューで、ページの再訪や設定の再利用が簡単になります。',['日ごとの概要','保存済みビュー']]
  ],
  changelog:'2.2.0 の新機能：簡体字中国語、スペイン語、ドイツ語、ブラジルポルトガル語、フランス語、日本語に対応しました。操作画面、初回・更新時の案内、HTML 出力、ウェブサイト、ストア画像を翻訳しました。英語も引き続き利用できます。CSV の列名、JSON のフィールド名、保存済みビュー、設定、権限の互換性を維持しています。既存の YouTube 動画は変更していません。',
  description:`閲覧履歴を CSV、JSON、読みやすい HTML でエクスポート。日付と列を選び、条件に合うページを便利なファイルとして端末に保存できます。

HistoryOut は無料です。アカウントやサブスクリプションは不要で、閲覧履歴をアップロードしません。

3 つの便利な形式
CSV：Excel、Google スプレッドシートなどで開いて分析できます。
JSON：構造化された記録をスクリプトやワークフローで利用できます。
HTML：クリックできるリンク付きの読みやすいファイルを、ブラウザでローカルに開けます。

必要な内容だけを保存
用意された期間や任意の日付を選択。タイトルや URL を検索し、サイトで絞り込んで、必要な列を選べます。ドメインやタイムスタンプも追加できます。一致する訪問をすべて残すか、URL ごとに 1 行として各ページの最後の一致する訪問だけを保存できます。

任意の URL クリーンアップ機能はクエリ文字列とフラグメントを削除します。履歴を匿名化する機能ではありません。タイトルや URL パスには個人情報が残る場合があります。

プレビューしてからダウンロード
プレビューには最大 100 行を表示します。ダウンロードするファイルには、読み込み済みの結果のうち条件に一致するすべての行を含めます。新しい訪問を読み込むには更新してください。

無料、端末内で処理
プレビューまたはエクスポートを選んだときに、利用可能な履歴を読み込みます。広告、分析トラッキング、アカウント登録はありません。履歴をサーバーに送信したり、ブラウザから削除したりしません。権限は history、storage、sidePanel のままです。

便利な機能も標準搭載
日ごとの概要と最近の閲覧履歴で、役立つページに戻りやすくなります。名前付きビューを保存すると、期間、フィルター、出力設定を再利用できます。保存済みビューはこの端末に設定を記憶する機能で、履歴の永久アーカイブではありません。

現在のブラウザプロファイルで利用できる履歴を扱います。削除した履歴は復元できず、アカウントの古い履歴へのアクセスも保証しません。訪問数はナビゲーションの回数であり、滞在時間や生産性を示すものではありません。

7 言語に対応
英語、簡体字中国語、スペイン語、ドイツ語、ブラジルポルトガル語、フランス語、日本語に対応。画面はブラウザの言語に合わせて表示されます。CSV の列名と JSON のフィールド名は既存のワークフローとの互換性を維持しています。

機能の提案
改善案の投稿や投票はこちら：https://historyout.featurebase.app/
公開のフィードバックボードは Featurebase が運営しています。閲覧履歴や出力設定は添付しません。投稿やコメントには別途 Featurebase へのログインが必要な場合があります。個別のお問い合わせ：sauliusthedev@gmail.com。

任意の支援
独立した開発への寄付はこちら：https://www.buymeacoffee.com/saulius.developer
支援の有無にかかわらず、すべての機能を無料で利用できます。友達への紹介ではインストールリンクをコピーして共有できます。

機能、使用例、対応ブラウザ、更新情報：https://exportchromehistory.app/ja/`
 }
};
module.exports={locales,localeKeys:Object.keys(locales)};
