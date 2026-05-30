(function () {
  const cfg = window.GRADUATION_CONFIG || {};
  const form = document.getElementById("uploadForm");
  const photoInput = document.getElementById("photoInput");
  const pickerPreview = document.getElementById("pickerPreview");
  const submitBtn = document.getElementById("submitBtn");
  const nameInput = document.getElementById("nameInput");
  const messageInput = document.getElementById("messageInput");
  const progressBox = document.getElementById("progressBox");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const errorBox = document.getElementById("errorBox");
  const uploadCard = document.getElementById("uploadCard");
  const successCeremony = document.getElementById("successCeremony");
  const successPhoto = document.getElementById("successPhoto");
  const successTheme = document.getElementById("successTheme");
  const uploadAnotherBtn = document.getElementById("uploadAnotherBtn");
  const successParticles = document.getElementById("successParticles");

  document.getElementById("collegeName").textContent = cfg.collegeName || "长沙理工大学交通学院硕士毕业纪念互动墙";
  document.getElementById("uploadTitle").textContent = cfg.uploadTitle || "点亮我的毕业星球";
  document.getElementById("uploadSubtitle").textContent = cfg.uploadSubtitle || "上传一张毕业照片，让它飞入大屏的 3D 研途星球";
  successTheme.textContent = cfg.themeTitle || "毕业留痕，以物换忆";

  function showError(message) {
    errorBox.hidden = false;
    errorBox.textContent = message;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  function setProgress(percent, text) {
    progressBox.hidden = false;
    progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    progressText.textContent = text;
  }

  function validateConfig() {
    if (!window.supabase) {
      throw new Error("Supabase SDK 加载失败，请检查网络或 CDN。");
    }
    if (!cfg.supabaseUrl || cfg.supabaseUrl.includes("你的项目ID")) {
      throw new Error("请先在 config.js 里填写 Supabase Project URL。");
    }
    if (!cfg.supabaseAnonKey || cfg.supabaseAnonKey.includes("替换成")) {
      throw new Error("请先在 config.js 里填写 Supabase anon public key。");
    }
  }

  function sanitizeText(value, fallback) {
    const text = String(value || "").replace(/[<>]/g, "").trim();
    return text || fallback;
  }

  function getFileExt(file) {
    const fromName = (file.name.split(".").pop() || "").toLowerCase();
    if (fromName && fromName.length <= 5) return fromName;
    const map = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif"
    };
    return map[file.type] || "jpg";
  }

  async function resizeImageIfNeeded(file) {
    // GIF 不压缩，避免动画丢失
    if (file.type === "image/gif") return file;

    const maxSize = 1800;
    const imageBitmap = await createImageBitmap(file).catch(() => null);
    if (!imageBitmap) return file;

    const { width, height } = imageBitmap;
    if (Math.max(width, height) <= maxSize && file.size <= 2.8 * 1024 * 1024) {
      return file;
    }

    const scale = Math.min(1, maxSize / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.86);
    });

    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now()
    });
  }

  function validateFile(file) {
    if (!file) throw new Error("请先选择一张照片。");

    const allowed = cfg.allowedImageTypes || ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      throw new Error("图片格式不支持，请上传 JPG、PNG、WEBP 或 GIF。");
    }

    const maxMB = Number(cfg.maxFileSizeMB || 10);
    if (file.size > maxMB * 1024 * 1024) {
      throw new Error(`图片不能超过 ${maxMB}MB，请换一张或先压缩。`);
    }
  }

  photoInput.addEventListener("change", () => {
    clearError();
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;

    try {
      validateFile(file);
      const url = URL.createObjectURL(file);
      pickerPreview.classList.add("has-image");
      pickerPreview.style.backgroundImage = `url("${url}")`;
    } catch (err) {
      showError(err.message);
      photoInput.value = "";
      pickerPreview.classList.remove("has-image");
      pickerPreview.style.backgroundImage = "";
    }
  });

  function makeParticles() {
    successParticles.innerHTML = "";
    for (let i = 0; i < 46; i++) {
      const p = document.createElement("i");
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 180;
      p.style.left = `${50 + (Math.random() - .5) * 14}%`;
      p.style.top = `${45 + (Math.random() - .5) * 12}%`;
      p.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
      p.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
      p.style.animationDelay = `${Math.random() * .3}s`;
      successParticles.appendChild(p);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    try {
      validateConfig();
      const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

      const originalFile = photoInput.files && photoInput.files[0];
      validateFile(originalFile);

      submitBtn.disabled = true;
      submitBtn.textContent = "正在点亮...";
      setProgress(10, "正在检查照片...");

      const name = sanitizeText(nameInput.value, "一位交通学院毕业生");
      const message = sanitizeText(messageInput.value, "研途有光，一路生花");

      setProgress(25, "正在优化照片...");
      const file = await resizeImageIfNeeded(originalFile);
      const ext = getFileExt(file);
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const filePath = `uploads/${safeName}`;

      setProgress(45, "正在上传照片到 Supabase Storage...");
      const { error: uploadError } = await client.storage
        .from(cfg.bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      setProgress(68, "正在生成照片访问地址...");
      const { data: publicUrlData } = client.storage
        .from(cfg.bucketName)
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData && publicUrlData.publicUrl;
      if (!imageUrl) throw new Error("获取照片公开地址失败，请检查 Storage bucket 是否为 public。");

      setProgress(82, "正在同步到大屏...");
      const { error: insertError } = await client
        .from(cfg.tableName)
        .insert({
          name,
          message,
          image_url: imageUrl,
          file_path: filePath
        });

      if (insertError) throw insertError;

      setProgress(100, "上传成功，请抬头看大屏！");
      successPhoto.src = imageUrl;
      uploadCard.hidden = true;
      successCeremony.hidden = false;
      makeParticles();
    } catch (err) {
      console.error(err);
      showError(err.message || "上传失败，请稍后再试。");
      progressBox.hidden = true;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "<span>上传并点亮大屏</span>";
    }
  });

  uploadAnotherBtn.addEventListener("click", () => {
    form.reset();
    pickerPreview.classList.remove("has-image");
    pickerPreview.style.backgroundImage = "";
    progressBox.hidden = true;
    clearError();
    successCeremony.hidden = true;
    uploadCard.hidden = false;
  });
})();
