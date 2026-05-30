/**
 * Supabase + 页面配置
 * 只填写 Supabase 的 Project URL 和 anon public key。
 * 注意：不要把 service_role key 放在这里。
 */
window.GRADUATION_CONFIG = {
  supabaseUrl: "https://cggcznuacfbvnrqejyrz.supabase.co",
  supabaseAnonKey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZ2N6bnVhY2Zidm5ycWVqeXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzkxNTEsImV4cCI6MjA5NTY1NTE1MX0.X5mwOQ1MGtRxMlkncWc-UpLm_o66hxhgt_ki2zkd3ig",

  bucketName: "graduation-photos",
  tableName: "photos",

  // 页面文案
  themeTitle: "毕业留痕，以物换忆",
  collegeName: "长沙理工大学交通学院硕士毕业纪念互动墙",
  uploadTitle: "点亮我的毕业星球",
  uploadSubtitle: "上传一张毕业照片，让它飞入大屏的 3D 研途星球",
  screenTitle: "毕业留痕，以物换忆",
  screenSubtitle: "长沙理工大学交通学院硕士毕业纪念互动墙",

  // 大屏参数
  sphereSlots: 52,
  ceremonySeconds: 5,
  highlightSeconds: 2,
  maxRecords: 18,

  // 上传限制
  maxFileSizeMB: 10,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],

  // 大屏二维码默认指向当前域名根路径，也就是 index.html 上传页
  uploadPath: "/"
};
