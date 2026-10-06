// ==================== BLOG YAZILARI ====================
// Yeni yazı eklemek için window.blogPosts dizisinin başına yeni bir nesne ekle
// (en yeni yazı en üstte). "content" alanı yazının HTML gövdesidir; aşağıdaki
// yardımcılar (flow, branchDiagram, fanoutDiagram ...) şık bileşenler üretir.
// h2 başlıkları "İçindekiler" listesine otomatik eklenir.
(() => {
  const icon = (paths) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  const ICONS = {
    globe: icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    mail: icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    database: icon(
      '<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v13c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-13M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
    ),
    zap: icon('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>'),
    code: icon('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>'),
    branch: icon(
      '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10c0 4-6 3-11 7"/>',
    ),
    rocket: icon(
      '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3a12 12 0 0 1 12-9 12 12 0 0 1-9 12Z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    ),
    megaphone: icon('<path d="M3 10v4h4l7 5V5l-7 5H3ZM17 9a4 4 0 0 1 0 6"/>'),
    pen: icon('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
    store: icon('<path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>'),
    info: icon('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    check: icon('<path d="m5 12 5 5 9-10"/>'),
    cross: icon('<path d="M6 6l12 12M18 6 6 18"/>'),
  };

  // "A → B → C" zincirleri: her adım bir kutu, aralarda ok
  const flow = (steps, { label = "İş akışı", variant = "" } = {}) =>
    `<ol class="flow ${variant}" aria-label="${label}">${steps.map((step) => `<li>${step}</li>`).join("")}</ol>`;

  const dNode = (name, variant = "") => `<div class="d-node ${variant}">${name}</div>`;
  const dLine = '<div class="d-line" aria-hidden="true"></div>';

  // Dikey akış + IF dallanması
  const branchDiagram = ({ caption, steps, decision = "IF", branches }) => `
    <figure class="diagram reveal">
      <div class="diagram__canvas">
        <div class="d-flow">
          ${steps.map((step, index) => dNode(step, index === 0 ? "d-node--trigger" : "")).join(dLine)}
          ${dLine}
          ${dNode(decision, "d-node--decision")}
          <div class="d-branches">
            ${branches
              .map(
                (branch) => `
                  <div class="d-branch d-branch--${branch.tone}">
                    <span class="d-branch__label">${branch.label}</span>
                    ${branch.nodes.map((name) => dNode(name)).join(dLine)}
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
      <figcaption>${caption}</figcaption>
    </figure>
  `;

  // Tek kaynaktan birçok servise dağılan akış
  const fanoutDiagram = ({ caption, source, hub, targets }) => `
    <figure class="diagram reveal">
      <div class="diagram__canvas">
        <div class="d-fanout">
          ${dNode(source, "d-node--trigger")}
          <div class="d-hline" aria-hidden="true"></div>
          ${dNode(hub, "d-node--hub")}
          <div class="d-targets">
            ${targets.map((name) => `<div class="d-target">${dNode(name)}</div>`).join("")}
          </div>
        </div>
      </div>
      <figcaption>${caption}</figcaption>
    </figure>
  `;

  const cardGrid = (items, variant = "") => `
    <div class="info-grid ${variant}">
      ${items
        .map(
          (item) => `
            <div class="info-card reveal">
              <span class="info-card__icon">${item.icon}</span>
              <div>
                <h4>${item.title}</h4>
                <p>${item.text}</p>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;

  const callout = (body, { tone = "info", title = "" } = {}) => `
    <aside class="callout callout--${tone}">
      <span class="callout__icon">${tone === "info" ? ICONS.info : ICONS.check}</span>
      <div>${title ? `<strong class="callout__title">${title}</strong>` : ""}${body}</div>
    </aside>
  `;

  const learnSteps = (steps) => `
    <ol class="learn-steps">
      ${steps
        .map(
          (step, index) => `
            <li class="learn-step reveal">
              <span class="learn-step__num">${index + 1}</span>
              <div>
                <h3>${step.title}</h3>
                ${step.body}
              </div>
            </li>
          `,
        )
        .join("")}
    </ol>
  `;

  const chips = (items, highlighted = []) => `
    <ul class="chip-cloud">
      ${items.map((item) => `<li class="${highlighted.includes(item) ? "is-key" : ""}">${item}</li>`).join("")}
    </ul>
  `;

  window.blogPosts = [
    {
      slug: "n8n-nedir",
      lang: "tr",
      title: "n8n Nedir? Otomasyon Dünyasına Yeni Başlayanlar İçin Kapsamlı Rehber",
      deck: "Tekrar eden işleri insan müdahalesi olmadan yapmak mümkün mü? n8n'in ne olduğunu, nasıl çalıştığını ve öğrenmeye nereden başlamanız gerektiğini adım adım anlatıyorum.",
      category: "Otomasyon",
      tags: ["n8n", "Otomasyon", "API", "Workflow"],
      date: "2026-10-06",
      dateLabel: "6 Ekim 2026",
      coverNodes: ["Trigger", "HTTP", "IF", "E-posta", "Log"],
      content: `
        <p class="post-lead">Günümüzde birçok iş, aslında insanların tek tek yapmak zorunda olduğu tekrar eden işlemlerden oluşuyor.</p>
        <p>Bir form dolduruluyor, bilgiler bir veritabanına kaydediliyor, ardından bir e-posta gönderiliyor. Başka bir sistemden veri alınıyor, işleniyor ve farklı bir platforma aktarılıyor.</p>
        <p>Peki bütün bunları insan müdahalesi olmadan yapmak mümkün mü?</p>
        <p class="post-emphasis">Evet.</p>
        <p>İşte tam bu noktada <strong>n8n</strong> gibi iş akışı otomasyon araçları devreye giriyor.</p>

        <h2>n8n Nedir?</h2>
        <p>n8n, farklı uygulamaları, servisleri ve API'leri birbirine bağlayarak otomatik iş akışları oluşturmanızı sağlayan bir <strong>workflow automation</strong> platformudur.</p>
        <p>Basitçe düşünürsek:</p>
        <blockquote class="post-quote"><p>"Bir şey olduğunda, belirlediğim işlemleri otomatik olarak gerçekleştir."</p></blockquote>
        <p>mantığıyla çalışır.</p>
        <p>Örneğin:</p>
        ${flow(["Bir müşteri form doldurur", "n8n form verisini alır", "Veritabanına kaydeder", "Satış ekibine e-posta gönderir", "Slack üzerinden bildirim gönderir"])}
        <p>Bütün bu işlemler tek bir workflow içerisinde otomatik olarak gerçekleştirilebilir.</p>

        <h2>n8n Nasıl Çalışır?</h2>
        <p>n8n'in temelinde <strong>node (düğüm)</strong> adı verilen parçalar bulunur.</p>
        <p>Her node belirli bir işi gerçekleştirir.</p>
        <p>Örneğin:</p>
        ${cardGrid([
          { icon: ICONS.globe, title: "HTTP Request", text: "Bir API'ye istek gönderir." },
          { icon: ICONS.mail, title: "Gmail", text: "E-posta gönderir veya e-postaları işler." },
          { icon: ICONS.database, title: "PostgreSQL", text: "Veritabanıyla iletişim kurar." },
          { icon: ICONS.zap, title: "Webhook", text: "Dışarıdan gelen isteği tetikleyici olarak kullanır." },
          { icon: ICONS.code, title: "Code", text: "JavaScript ile özel işlemler yapmanızı sağlar." },
          { icon: ICONS.branch, title: "IF", text: "Şarta göre farklı yollar oluşturur." },
        ])}
        <p>Bu node'ları birbirine bağlayarak bir workflow oluşturursunuz.</p>
        <p>Örneğin:</p>
        ${flow(["Webhook", "Veriyi Kontrol Et", "Veritabanına Kaydet", "E-posta Gönder"])}
        <p>Böylece sistem, belirlediğiniz işlemleri sizin yerinize gerçekleştirir.</p>

        <h2>n8n Neden Kullanılır?</h2>
        <p>n8n'in en önemli amacı <strong>tekrarlayan işleri otomatikleştirmektir.</strong></p>
        <p>Bir işi her gün, her saat veya her müşteri için manuel olarak yapmak yerine bir kez workflow oluşturup işlemin otomatik gerçekleşmesini sağlayabilirsiniz.</p>
        <p>Örneğin bir e-ticaret sitesi düşünelim.</p>
        <p>Bir müşteri sipariş verdiğinde:</p>
        <ol class="numbered-list">
          <li>Sipariş bilgisi alınır.</li>
          <li>Stok kontrol edilir.</li>
          <li>Sipariş veritabanına kaydedilir.</li>
          <li>Müşteriye onay e-postası gönderilir.</li>
          <li>Kargo sistemine bilgi gönderilir.</li>
          <li>Şirketteki ilgili kişiye bildirim gönderilir.</li>
        </ol>
        <p>Normalde bunların tamamı farklı sistemler tarafından gerçekleştirilebilir.</p>
        <p>n8n ise bu sistemleri birbirine bağlayan bir <strong>otomasyon katmanı</strong> olarak kullanılabilir.</p>

        <h2>n8n ile Neler Yapılabilir?</h2>
        <p>n8n'in kullanım alanı oldukça geniştir.</p>

        <h3 class="usecase-title"><span>01</span>E-posta Otomasyonu</h3>
        <p>Örneğin web sitenizde bir iletişim formu olduğunu düşünelim.</p>
        <p>Bir ziyaretçi formu doldurduğunda:</p>
        ${flow(["Form", "n8n", "E-posta"])}
        <p>şeklinde bir workflow oluşturabilirsiniz.</p>
        <p>Daha gelişmiş bir sistemde ise:</p>
        ${flow(["Form", "Spam kontrolü", "CRM'e kaydet", "Satış ekibine bildir", "Müşteriye otomatik cevap gönder"])}
        <p>şeklinde çalışabilir.</p>

        <h3 class="usecase-title"><span>02</span>API'leri Birbirine Bağlamak</h3>
        <p>n8n'in en güçlü taraflarından biri API'lerle çalışabilmesidir.</p>
        <p>Örneğin bir API'den veri alıp başka bir API'ye gönderebilirsiniz.</p>
        ${flow(["API A", "n8n", "Veriyi işle", "API B"])}
        <p>Bu sayede normalde birbirleriyle doğrudan konuşmayan iki sistem arasında bağlantı oluşturabilirsiniz.</p>
        <p>Örneğin:</p>
        <ul class="tick-list">
          <li>Bir CRM sistemi</li>
          <li>Bir ödeme sistemi</li>
          <li>Bir veritabanı</li>
          <li>Bir yapay zekâ servisi</li>
        </ul>
        <p>aynı workflow içerisinde kullanılabilir.</p>

        <h3 class="usecase-title"><span>03</span>Yapay Zekâ ile Otomasyon</h3>
        <p>n8n'i yapay zekâ servisleriyle birlikte kullanmak da mümkündür.</p>
        <p>Örneğin bir müşteri destek sistemi düşünelim.</p>
        <p>Müşteri bir mesaj gönderir.</p>
        <p>Workflow şu şekilde çalışabilir:</p>
        ${flow(["Müşteri mesajı", "n8n", "Yapay zekâ", "Cevap oluştur", "Müşteriye gönder"])}
        <p>Daha gelişmiş bir sistemde yapay zekâ gelen mesajın kategorisini belirleyebilir.</p>
        <p>Örneğin:</p>
        <blockquote class="post-quote post-quote--chat"><p>"Siparişim nerede?"</p></blockquote>
        <p>mesajını <strong>sipariş takibi</strong> olarak sınıflandırabilir.</p>
        <p>Ardından n8n ilgili API'den sipariş durumunu alıp müşteriye cevap gönderebilir.</p>
        <p>Böylece yalnızca yapay zekâ değil, <strong>yapay zekâ + API + veritabanı + otomasyon</strong> birlikte kullanılabilir.</p>

        <h3 class="usecase-title"><span>04</span>Veritabanı İşlemleri</h3>
        <p>n8n farklı veritabanlarıyla da çalışabilir.</p>
        <p>Örneğin PostgreSQL kullanan bir uygulamanız olduğunu düşünelim.</p>
        <p>Yeni bir kullanıcı oluşturulduğunda:</p>
        ${flow(["Uygulama", "n8n", "PostgreSQL", "Bildirim"])}
        <p>gibi bir workflow oluşturabilirsiniz.</p>
        <p>Ayrıca verileri çekebilir, filtreleyebilir, değiştirebilir ve başka sistemlere aktarabilirsiniz.</p>

        <h3 class="usecase-title"><span>05</span>Webhook Kullanımı</h3>
        <p>Webhook, n8n'in en önemli özelliklerinden biridir.</p>
        <p>Bir webhook'u, dışarıdan gelen bir isteğin workflow'u başlatmasını sağlayan bir giriş noktası olarak düşünebilirsiniz.</p>
        <p>Örneğin:</p>
        <p>Bir web sitenizde kullanıcı ödeme yaptığında ödeme sistemi n8n'deki webhook adresine istek gönderir.</p>
        <p>n8n bunu algılar ve workflow'u çalıştırır.</p>
        <p>Örneğin:</p>
        ${flow(["Ödeme gerçekleşti", "Webhook", "Siparişi kontrol et", "Veritabanına kaydet", "E-posta gönder"])}
        <p>Bu yöntem özellikle web uygulamaları ve backend sistemleriyle entegrasyonlarda oldukça kullanışlıdır.</p>

        <h2>n8n'in En Büyük Avantajlarından Biri: Görsel Workflow</h2>
        <p>n8n'in önemli özelliklerinden biri işlemleri görsel olarak oluşturabilmenizdir.</p>
        <p>Örneğin workflow'unuz şu şekilde görünebilir:</p>
        ${branchDiagram({
          caption: "Webhook ile başlayan, IF ile ikiye ayrılan örnek bir workflow",
          steps: ["Webhook", "Veriyi Kontrol Et"],
          branches: [
            { label: "Başarılı", tone: "ok", nodes: ["Database", "E-posta"] },
            { label: "Hatalı", tone: "err", nodes: ["Bildirim"] },
          ],
        })}
        <p>Bu yaklaşım özellikle karmaşık otomasyonların anlaşılmasını kolaylaştırır.</p>
        <p>Workflow'un hangi aşamada olduğunu görsel olarak takip edebilirsiniz.</p>

        <h2>n8n Kod Yazmayı Tamamen Ortadan Kaldırır mı?</h2>
        ${callout("<p>Bu önemli bir nokta.</p>", { title: "Hayır." })}
        <p>n8n'in amacı kodlamayı tamamen ortadan kaldırmak değil, <strong>gereksiz kod miktarını azaltmaktır.</strong></p>
        <p>Basit işlemler için node'ları birbirine bağlamak yeterli olabilir.</p>
        <p>Ancak daha karmaşık işlemlerde JavaScript kullanabilirsiniz.</p>
        <p>Örneğin API'den gelen veriyi özel bir kurala göre değiştirmek istediğinizde <code>Code</code> node kullanabilirsiniz.</p>
        <p>Bu nedenle n8n'i:</p>
        <div class="compare">
          <div class="compare__card compare__card--no">
            <span class="compare__badge">${ICONS.cross}</span>
            <p>"Kod yazmadan her şeyi yapabileceğiniz bir araç"</p>
            <small>olarak düşünmek yerine:</small>
          </div>
          <div class="compare__card compare__card--yes">
            <span class="compare__badge">${ICONS.check}</span>
            <p><strong>"Kod, API ve servisleri bir workflow içerisinde birleştiren bir otomasyon platformu"</strong></p>
            <small>olarak düşünmek daha doğru olur.</small>
          </div>
        </div>

        <h2>n8n Kimler İçin Faydalıdır?</h2>
        <p>n8n sadece yazılımcılar için değildir.</p>
        ${cardGrid(
          [
            { icon: ICONS.code, title: "Yazılımcılar", text: "API'leri birbirine bağlamak, backend süreçlerini otomatikleştirmek ve servisler arasında veri aktarmak için kullanabilir." },
            { icon: ICONS.rocket, title: "Girişimciler", text: "Tekrarlayan operasyonları otomatikleştirerek zamandan tasarruf edebilir." },
            { icon: ICONS.megaphone, title: "Pazarlama ekipleri", text: "Form, e-posta, CRM ve raporlama süreçlerini otomatikleştirebilir." },
            { icon: ICONS.pen, title: "İçerik üreticileri", text: "İçerik oluşturma, veri toplama ve yayınlama süreçlerinde otomasyon oluşturabilir." },
            { icon: ICONS.store, title: "Küçük işletmeler", text: "Manuel olarak yapılan birçok operasyonu otomatik hale getirebilir." },
          ],
          "info-grid--wide",
        )}

        <h2>n8n Öğrenmeye Nereden Başlanmalı?</h2>
        <p>n8n öğrenirken doğrudan karmaşık AI agent sistemlerine atlamak yerine temel mantığı öğrenmek daha doğru olur.</p>
        <p>Önerilen sıra şöyle olabilir:</p>
        ${learnSteps([
          {
            title: "Trigger mantığını öğrenin",
            body: `<p>Bir workflow nasıl başlıyor?</p><p>Örneğin:</p>${chips(["Manuel çalıştırma", "Schedule", "Webhook", "Bir uygulamadaki olay"])}`,
          },
          { title: "Node mantığını öğrenin", body: "<p>Node'ların ne yaptığını anlamaya başlayın.</p>" },
          { title: "Veri aktarımını öğrenin", body: "<p>Bir node'dan gelen verinin diğer node'a nasıl aktarıldığını öğrenin.</p>" },
          { title: "IF ve Switch gibi koşulları öğrenin", body: "<p>Workflow içerisinde karar mekanizmaları oluşturun.</p>" },
          {
            title: "HTTP Request öğrenin",
            body: "<p>Buradan sonra n8n'in gerçek gücü ortaya çıkmaya başlar.</p><p>Çünkü API'lerle doğrudan iletişim kurabilirsiniz.</p>",
          },
          { title: "JSON ve API mantığını öğrenin", body: "<p>n8n kullanırken JSON ve HTTP hakkında temel bilgi büyük avantaj sağlar.</p>" },
          { title: "Code node öğrenin", body: "<p>Son olarak gerektiğinde JavaScript kullanarak workflow'ları özelleştirebilirsiniz.</p>" },
        ])}

        <h2>Basit Bir n8n Projesi</h2>
        <p>Öğrenmek için küçük bir proje yapalım.</p>
        <p>Diyelim ki her gün saat 09:00'da belirli bir API'den veri almak istiyoruz.</p>
        <p>Workflow:</p>
        ${branchDiagram({
          caption: "Her sabah 09:00'da çalışan basit bir veri alma workflow'u",
          steps: ["Schedule Trigger", "HTTP Request", "Veriyi İşle"],
          branches: [
            { label: "Uygun", tone: "ok", nodes: ["E-posta"] },
            { label: "Değil", tone: "err", nodes: ["Log"] },
          ],
        })}
        <p>Bu küçük proje bile n8n'in temel mantığını öğretir:</p>
        ${flow(["Tetikle", "Veri al", "Veriyi işle", "Karar ver", "Aksiyon gerçekleştir"], { variant: "flow--numbered" })}
        <p>Aslında n8n'in temel çalışma mantığı büyük ölçüde budur.</p>

        <h2>n8n Kullanırken Öğrenilmesi Gereken Temel Kavramlar</h2>
        <p>n8n öğrenmeye başlayan bir kişinin şu kavramlara hâkim olması büyük avantaj sağlar:</p>
        ${chips(
          ["Workflow", "Node", "Trigger", "Webhook", "API", "HTTP", "JSON", "Authentication", "Environment variables", "Expressions", "JavaScript", "Database", "Error handling"],
          ["API", "JSON", "HTTP", "Webhook"],
        )}
        <p>Özellikle <strong>API + JSON + HTTP + Webhook</strong> konularını öğrenmek n8n kullanımını ciddi şekilde kolaylaştırır.</p>

        <h2>n8n Sadece Otomasyon Aracı Değil</h2>
        <p>n8n'i yalnızca "iki uygulamayı birbirine bağlayan araç" olarak görmek biraz eksik kalır.</p>
        <p>Daha gelişmiş kullanımda n8n, küçük bir uygulamanın backend süreçlerini yöneten bir <strong>orkestrasyon katmanı</strong> gibi kullanılabilir.</p>
        <p>Örneğin:</p>
        ${fanoutDiagram({
          caption: "n8n, tek bir webhook'tan gelen veriyi birden fazla servise dağıtan orkestrasyon katmanı olarak",
          source: "Webhook",
          hub: "n8n",
          targets: ["PostgreSQL", "AI API", "CRM", "E-posta"],
        })}
        <p>Burada n8n bütün bu servisler arasındaki veri akışını yönetir.</p>
        <p>Bu nedenle n8n'i öğrenirken yalnızca node'ları ezberlemek yerine <strong>verinin sistem içerisinde nasıl hareket ettiğini</strong> anlamak çok daha değerlidir.</p>

        <h2>Sonuç</h2>
        <p>n8n, tekrar eden işlemleri otomatikleştirmek, farklı servisleri birbirine bağlamak ve API tabanlı sistemler oluşturmak için güçlü bir araçtır.</p>
        <p>Basit bir e-posta otomasyonundan başlayıp, yapay zekâ destekli müşteri hizmetleri, veri işleme sistemleri veya birden fazla servisi bir araya getiren karmaşık workflow'lara kadar kullanılabilir.</p>
        <p>n8n öğrenmek isteyen biri için en önemli nokta ise node'ları tek tek ezberlemek değildir.</p>
        <p>Asıl önemli olan şu mantığı anlamaktır:</p>
        <div class="key-takeaway">
          ${flow(
            ["Bir olay gerçekleşir", "veri gelir", "veri işlenir", "karar verilir", "gerekli işlemler otomatik olarak gerçekleştirilir"],
            { variant: "flow--numbered", label: "n8n'in temel mantığı" },
          )}
        </div>
        <p>Bu mantığı kavradığınızda n8n, yalnızca bir otomasyon aracı olmaktan çıkar ve farklı sistemleri birbirine bağlayarak kendi otomasyon altyapınızı kurabileceğiniz güçlü bir platforma dönüşür.</p>
      `,
    },
  ];
})();
