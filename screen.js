(function () {
  const cfg = window.GRADUATION_CONFIG || {};
  const sphere = document.getElementById("photoSphere");
  const sphereStage = document.getElementById("sphereStage");
  const sphereWrap = document.getElementById("sphereWrap");
  const main = document.querySelector(".screen-main");
  const recordPanel = document.getElementById("recordPanel");
  const recordList = document.getElementById("recordList");
  const totalCount = document.getElementById("totalCount");
  const qrPanel = document.getElementById("qrPanel");
  const qrcode = document.getElementById("qrcode");
  const uploadUrlText = document.getElementById("uploadUrlText");
  const statusEl = document.getElementById("connectionStatus");

  const ceremonyOverlay = document.getElementById("ceremonyOverlay");
  const ceremonyPhoto = document.getElementById("ceremonyPhoto");
  const ceremonyName = document.getElementById("ceremonyName");
  const ceremonyBlessing = document.getElementById("ceremonyBlessing");
  const ceremonyMessage = document.getElementById("ceremonyMessage");

  const toggleRecordsBtn = document.getElementById("toggleRecordsBtn");
  const toggleQrBtn = document.getElementById("toggleQrBtn");
  const toggleRotateBtn = document.getElementById("toggleRotateBtn");
  const slowerBtn = document.getElementById("slowerBtn");
  const fasterBtn = document.getElementById("fasterBtn");
  const focusLatestBtn = document.getElementById("focusLatestBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");

  document.getElementById("screenTitle").textContent = cfg.screenTitle || cfg.themeTitle || "毕业留痕，以物换忆";
  document.getElementById("screenSubtitle").textContent = cfg.screenSubtitle || cfg.collegeName || "长沙理工大学交通学院硕士毕业纪念互动墙";

  const slotCount = Number(cfg.sphereSlots || 52);
  const maxRecords = Number(cfg.maxRecords || 18);
  const ceremonyMs = Number(cfg.ceremonySeconds || 5) * 1000;
  const highlightMs = Number(cfg.highlightSeconds || 2) * 1000;

  const blessings = [
    "毕业快乐，前程似锦",
    "研途有光，一路生花",
    "从长理出发，向星辰大海",
    "此去山海辽阔，归来仍是长理人",
    "愿你一路坦途，奔赴热爱",
    "你的毕业瞬间，正在被珍藏"
  ];

  const placeholderTexts = [
    "等待你的毕业瞬间",
    "研途有你",
    "点亮毕业星球",
    "交通学院",
    "下一张照片会是谁",
    "毕业留痕"
  ];

  let photos = [];
  let records = [];
  let cards = [];
  let rotation = 0;
  let rotationX = -8;
  let speed = 0.08;
  let paused = false;
  let latestPhotoId = null;
  let client = null;

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.classList.remove("ok", "bad");
    if (type) statusEl.classList.add(type);
  }

  function validateConfig() {
    if (!window.supabase) throw new Error("Supabase SDK 加载失败，请检查网络。");
    if (!cfg.supabaseUrl || cfg.supabaseUrl.includes("你的项目ID")) {
      throw new Error("请先在 config.js 填写 Supabase Project URL。");
    }
    if (!cfg.supabaseAnonKey || cfg.supabaseAnonKey.includes("替换成")) {
      throw new Error("请先在 config.js 填写 Supabase anon public key。");
    }
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatTime(value) {
    if (!value) return "刚刚";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "刚刚";
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  function getUploadUrl() {
    const path = cfg.uploadPath || "/";
    return new URL(path, window.location.origin).href;
  }

  function setupQRCode() {
    const url = getUploadUrl();
    uploadUrlText.textContent = url.replace(/^https?:\/\//, "");

    if (window.QRCode) {
      qrcode.innerHTML = "";
      new window.QRCode(qrcode, {
        text: url,
        width: 124,
        height: 124,
        correctLevel: window.QRCode.CorrectLevel.H
      });
    } else {
      qrcode.innerHTML = `<div style="color:#061225;font-size:12px;line-height:1.5;padding:10px;">${escapeHTML(url)}</div>`;
    }
  }

  function createLandmarkLayer() {
    const landmarks = [
      {
        title: "长理学校校门",
        x: "6%",
        y: "14%",
        size: 176,
        svg: `
          <svg viewBox="0 0 220 220" class="landmark-svg">
            <path d="M32 164 H188" class="thin"/><path d="M46 176 H174" class="thin"/>
            <path d="M56 140 H164" /><path d="M64 126 H156" /><path d="M72 114 H148" /><path d="M84 100 H136" />
            <path d="M76 92 H144" /><path d="M86 84 H134" /><path d="M96 76 H124" /><path d="M102 68 H118" />
            <path d="M66 126 V156" /><path d="M86 114 V156" /><path d="M134 114 V156" /><path d="M154 126 V156" />
            <path d="M34 148 H66" /><path d="M154 148 H186" /><path d="M40 140 H66" class="thin"/><path d="M154 140 H180" class="thin"/>
            <rect x="88" y="96" width="44" height="12" rx="2" class="thin-shape"/><text x="110" y="105" class="tiny-word">长沙理工大学</text>
            <path d="M36 136 C28 124, 42 118, 50 128 C56 120, 68 126, 62 138" class="thin"/>
            <path d="M158 136 C150 124, 164 118, 172 128 C178 120, 190 126, 184 138" class="thin"/>
            <text x="110" y="203">长理学校校门</text>
          </svg>`
      },
      {
        title: "年轮广场",
        x: "75%",
        y: "11%",
        size: 154,
        svg: `
          <svg viewBox="0 0 220 220" class="landmark-svg">
            <path d="M46 162 C72 154, 148 154, 174 162" class="thin"/><path d="M58 176 C84 182, 136 182, 162 176" class="thin"/>
            <circle cx="110" cy="105" r="40" /><circle cx="110" cy="105" r="28" class="thin"/><circle cx="110" cy="105" r="16" class="thin"/>
            <path d="M110 65 V145" /><path d="M70 105 H150" /><path d="M82 77 L138 133" class="thin"/><path d="M138 77 L82 133" class="thin"/>
            <path d="M96 146 H124" /><path d="M90 154 H130" /><path d="M84 162 H136" />
            <path d="M98 145 V154" class="thin"/><path d="M110 145 V154" class="thin"/><path d="M122 145 V154" class="thin"/>
            <path d="M66 168 L154 168" class="thin"/><path d="M76 180 L144 180" class="thin"/>
            <text x="110" y="203">年轮广场</text>
          </svg>`
      },
      {
        title: "九云方鼎",
        x: "12%",
        y: "66%",
        size: 152,
        svg: `
          <svg viewBox="0 0 220 220" class="landmark-svg">
            <path d="M48 164 C74 154, 146 154, 172 164" class="thin"/><path d="M62 178 C86 184, 134 184, 158 178" class="thin"/>
            <path d="M76 68 L102 40 L160 68 L146 82 L88 82 Z" /><path d="M102 40 L106 60" class="thin"/><path d="M160 68 L144 70" class="thin"/>
            <path d="M84 82 L100 70 L142 84 L134 154 L90 154 Z" /><path d="M100 70 L95 154" class="thin"/><path d="M142 84 L118 96 L112 154" class="thin"/>
            <path d="M99 102 H122 L118 136 H96 Z" /><path d="M104 108 H116" class="thin"/><path d="M102 120 H114" class="thin"/>
            <path d="M84 82 L72 94 L80 154 H90" /><path d="M142 84 L154 96 L138 154 H134" />
            <circle cx="101" cy="92" r="3" /><circle cx="120" cy="93" r="3" /><circle cx="138" cy="94" r="3" />
            <text x="110" y="203">九云方鼎</text>
          </svg>`
      },
      {
        title: "图书馆",
        x: "74%",
        y: "64%",
        size: 178,
        svg: `
          <svg viewBox="0 0 220 220" class="landmark-svg">
            <path d="M28 158 C60 166, 160 166, 192 158" /><path d="M42 171 C76 178, 144 178, 178 171" class="thin"/><path d="M58 184 C88 188, 132 188, 162 184" class="thin"/>
            <path d="M68 146 H152" /><path d="M60 152 H160" class="thin"/><path d="M54 158 H166" class="thin"/>
            <rect x="34" y="96" width="46" height="46" rx="2" /><rect x="140" y="96" width="46" height="46" rx="2" />
            <path d="M42 108 H72 M42 120 H72 M42 132 H72" class="thin"/><path d="M148 108 H178 M148 120 H178 M148 132 H178" class="thin"/>
            <rect x="80" y="58" width="60" height="84" rx="3" /><path d="M88 68 H132 M88 82 H132 M88 96 H132 M88 110 H132 M88 124 H132" class="thin"/>
            <path d="M98 58 V142 M122 58 V142" class="thin"/><rect x="97" y="84" width="26" height="58" rx="2" /><path d="M110 84 V142 M97 104 H123 M97 122 H123" class="thin"/>
            <rect x="72" y="64" width="8" height="78" /><rect x="140" y="64" width="8" height="78" />
            <path d="M66 52 H154" /><path d="M56 60 H164" /><path d="M80 46 H94 V56 H80 Z" /><path d="M126 46 H140 V56 H126 Z" /><path d="M90 40 H130" class="thin"/>
            <text x="110" y="203">图书馆</text>
          </svg>`
      },
      {
        title: "云影湖",
        x: "29%",
        y: "80%",
        size: 162,
        svg: `
          <svg viewBox="0 0 220 220" class="landmark-svg">
            <path d="M26 136 C52 120, 88 122, 112 132 C134 140, 158 140, 188 126" />
            <path d="M28 150 C56 140, 84 140, 112 146 C138 152, 164 152, 190 144" class="thin"/><path d="M42 164 C76 160, 142 160, 176 164" class="thin"/>
            <path d="M56 120 C74 108, 102 108, 122 120" /><path d="M64 120 V130 M80 116 V128 M96 114 V128 M112 118 V130" class="thin"/>
            <path d="M144 100 H170" /><path d="M150 92 H164" /><path d="M154 84 H160" /><path d="M150 100 V116" /><path d="M164 100 V116" /><path d="M146 116 H168" class="thin"/>
            <path d="M30 118 C22 104, 36 96, 46 108 C56 98, 70 108, 58 122" class="thin"/>
            <path d="M178 112 C170 98, 184 92, 194 104 C202 96, 210 106, 202 118" class="thin"/>
            <path d="M88 152 V138 M94 154 V140 M100 153 V141" class="thin"/><path d="M126 154 V140 M132 152 V138 M138 153 V141" class="thin"/>
            <text x="110" y="203">云影湖</text>
          </svg>`
      },
      {
        title: "工科二楼",
        x: "48%",
        y: "8%",
        size: 170,
        svg: `
          <svg viewBox="0 0 220 220" class="landmark-svg">
            <rect x="30" y="92" width="128" height="50" rx="2" />
            <path d="M40 104 H148 M40 118 H148 M40 132 H148" class="thin"/><path d="M52 92 V142 M74 92 V142 M96 92 V142 M118 92 V142 M140 92 V142" class="thin"/>
            <rect x="158" y="76" width="30" height="66" rx="2" /><path d="M166 88 H180 M166 102 H180 M166 116 H180 M166 130 H180" class="thin"/>
            <rect x="86" y="114" width="22" height="28" rx="2" /><path d="M82 114 H112" /><path d="M78 108 H116" class="thin"/>
            <path d="M90 114 V142" class="thin"/><path d="M98 114 V142" class="thin"/><path d="M104 114 V142" class="thin"/>
            <path d="M30 84 H158" /><path d="M162 68 H194 V76 H158" /><path d="M170 68 V54 H194" />
            <path d="M42 156 H188" /><path d="M56 168 H174" class="thin"/><path d="M70 180 H160" class="thin"/>
            <path d="M36 144 C28 132, 44 126, 52 136 C58 128, 68 134, 62 146" class="thin"/>
            <path d="M170 146 C162 134, 178 128, 186 138 C192 130, 202 136, 196 148" class="thin"/>
            <text x="110" y="203">工科二楼</text>
          </svg>`
      }
    ];

    const layer = document.createElement("div");
    layer.className = "csust-landmark-layer";
    layer.innerHTML = landmarks.map((item, index) => `
      <div class="csust-landmark-bubble" title="${escapeHTML(item.title)}"
        style="--x:${item.x};--y:${item.y};--size:${item.size}px;animation-delay:${index * -1.4}s;">
        ${item.svg}
      </div>
    `).join("");
    document.body.prepend(layer);
  }

  function fibonacciPoint(index, total) {
    const phi = Math.acos(1 - 2 * (index + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (index + 0.5);
    const x = Math.cos(theta) * Math.sin(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(phi);
    return { x, y, z };
  }

  function photoForSlot(index) {
    if (!photos.length) return null;
    if (photos.length <= slotCount) return photos[index] || null;

    const start = Math.max(0, photos.length - slotCount);
    return photos[start + index] || null;
  }

  function renderSphere() {
    const radius = Math.min(sphereStage.offsetWidth, sphereStage.offsetHeight) * 0.38;
    sphere.innerHTML = "";
    cards = [];

    for (let i = 0; i < slotCount; i++) {
      const photo = photoForSlot(i);
      const point = fibonacciPoint(i, slotCount);
      const card = document.createElement("div");
      card.className = `sphere-card ${photo ? "" : "placeholder"}`;
      card.dataset.slot = String(i);
      if (photo && photo.id) card.dataset.id = photo.id;

      if (photo) {
        card.innerHTML = `<img src="${escapeHTML(photo.image_url)}" alt="${escapeHTML(photo.name || "毕业照片")}" loading="eager">`;
      } else {
        card.innerHTML = `<span>${placeholderTexts[i % placeholderTexts.length]}</span>`;
      }

      card._point = {
        x: point.x * radius,
        y: point.y * radius,
        z: point.z * radius
      };

      sphere.appendChild(card);
      cards.push(card);
    }

    updateSphereTransform();
  }

  function updateSphereTransform() {
    const radY = rotation * Math.PI / 180;
    const radX = rotationX * Math.PI / 180;

    cards.forEach((card) => {
      const p = card._point;
      const x1 = p.x * Math.cos(radY) + p.z * Math.sin(radY);
      const z1 = -p.x * Math.sin(radY) + p.z * Math.cos(radY);
      const y1 = p.y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = p.y * Math.sin(radX) + z1 * Math.cos(radX);

      const scale = 0.72 + ((z2 + 320) / 640) * 0.55;
      const opacity = Math.max(0.26, Math.min(1, 0.38 + ((z2 + 320) / 640) * 0.72));

      card.style.transform = `translate3d(${x1}px, ${y1}px, ${z2}px) scale(${scale})`;
      card.style.opacity = opacity.toFixed(2);
      card.style.zIndex = String(Math.round(z2 + 500));

      if (card.dataset.id === latestPhotoId) {
        card.classList.add("latest");
      } else {
        card.classList.remove("latest");
      }
    });
  }

  function animate() {
    if (!paused) {
      rotation += speed;
    }
    updateSphereTransform();
    requestAnimationFrame(animate);
  }

  function addPhotoToSphere(photo, options = {}) {
    if (!photo || !photo.image_url) return;

    const exists = photos.some((item) => item.id === photo.id);
    if (!exists) {
      photos.push(photo);
    }

    latestPhotoId = photo.id || null;
    renderSphere();
    renderRecords();

    if (options.focus !== false) {
      focusLatest();
    }

    setTimeout(() => {
      if (latestPhotoId === photo.id) latestPhotoId = null;
    }, highlightMs);
  }

  function renderRecords() {
    totalCount.textContent = String(photos.length);

    records = photos.slice(-maxRecords).reverse();
    if (!records.length) {
      recordList.innerHTML = `<div class="empty-record">等待第一位毕业生点亮星球</div>`;
      return;
    }

    recordList.innerHTML = records.map((photo) => `
      <article class="record-item">
        <img src="${escapeHTML(photo.image_url)}" alt="">
        <div>
          <strong>${escapeHTML(photo.name || "一位毕业生")} 点亮了毕业星球</strong>
          <p>${escapeHTML(photo.message || "毕业快乐，前程似锦")} · ${formatTime(photo.created_at)}</p>
        </div>
      </article>
    `).join("");
  }

  function showCeremony(photo) {
    ceremonyPhoto.src = photo.image_url;
    ceremonyName.textContent = `${photo.name || "一位交通学院毕业生"} 的毕业瞬间已点亮`;
    ceremonyBlessing.textContent = blessings[Math.floor(Math.random() * blessings.length)];
    ceremonyMessage.textContent = photo.message || "毕业留痕，以物换忆";
    ceremonyOverlay.hidden = false;

    setTimeout(() => {
      ceremonyOverlay.hidden = true;
      addPhotoToSphere(photo);
    }, ceremonyMs);
  }

  function focusLatest() {
    if (!latestPhotoId) return;

    const card = cards.find((item) => item.dataset.id === latestPhotoId);
    if (!card || !card._point) return;

    const p = card._point;
    // 把最新照片大致转向前方，避免“上传了找不到”
    const target = Math.atan2(-p.x, p.z) * 180 / Math.PI;
    rotation = target;
    card.classList.add("highlight");
    setTimeout(() => card.classList.remove("highlight"), highlightMs);
  }

  async function loadExistingPhotos() {
    setStatus("正在加载已有照片...", null);

    const { data, error } = await client
      .from(cfg.tableName)
      .select("*")
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) throw error;

    photos = Array.isArray(data) ? data : [];
    renderSphere();
    renderRecords();
  }

  function subscribeRealtime() {
    client
      .channel("photos-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: cfg.tableName
        },
        (payload) => {
          const photo = payload.new;
          if (!photo || !photo.image_url) return;
          if (photos.some((item) => item.id === photo.id)) return;
          showCeremony(photo);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setStatus("实时同步已连接", "ok");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setStatus(`实时同步异常：${status}`, "bad");
        } else {
          setStatus(`实时同步状态：${status}`, null);
        }
      });
  }

  function bindControls() {
    toggleRecordsBtn.addEventListener("click", () => {
      const hidden = recordPanel.classList.toggle("hidden");
      main.classList.toggle("records-hidden", hidden);
      toggleRecordsBtn.textContent = hidden ? "显示记录" : "隐藏记录";
    });

    toggleQrBtn.addEventListener("click", () => {
      const hidden = qrPanel.classList.toggle("hidden");
      toggleQrBtn.textContent = hidden ? "显示二维码" : "隐藏二维码";
    });

    toggleRotateBtn.addEventListener("click", () => {
      paused = !paused;
      toggleRotateBtn.textContent = paused ? "继续旋转" : "暂停旋转";
    });

    slowerBtn.addEventListener("click", () => {
      speed = Math.max(0.015, speed * 0.72);
    });

    fasterBtn.addEventListener("click", () => {
      speed = Math.min(0.5, speed * 1.32);
    });

    focusLatestBtn.addEventListener("click", focusLatest);

    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });

    window.addEventListener("resize", renderSphere);
  }

  async function init() {
    try {
      validateConfig();
      createLandmarkLayer();
      setupQRCode();
      bindControls();
      renderSphere();
      animate();

      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      await loadExistingPhotos();
      subscribeRealtime();
    } catch (err) {
      console.error(err);
      setStatus(err.message || "初始化失败", "bad");
      renderSphere();
      animate();
    }
  }

  init();
})();
function initUploadQRCode() {
  const qrBox = document.getElementById("qrcode");
  const uploadUrlText = document.getElementById("uploadUrlText");

  if (!qrBox) return;

  const uploadUrl = `${window.location.origin}/`;

  const qrImgUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=" +
    encodeURIComponent(uploadUrl);

  qrBox.innerHTML = `
    <img 
      src="${qrImgUrl}" 
      alt="扫码上传毕业照片"
      style="
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 12px;
        background: #fff;
        padding: 8px;
        box-sizing: border-box;
      "
    />
  `;

  if (uploadUrlText) {
    uploadUrlText.textContent = uploadUrl;
  }
}

initUploadQRCode();

