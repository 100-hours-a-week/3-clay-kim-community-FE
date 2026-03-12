const dotenv = require("dotenv");
const express = require("express");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });
dotenv.config({
  path: path.join(__dirname, ".env.local"),
  override: true,
  quiet: true,
});

const port = Number.parseInt(process.env.PORT, 10) || 3000;
const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:8080/api";
const frontendOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${port}`;

const app = express();

// config.js를 환경변수 기반으로 동적 생성하여 서빙
app.get("/utils/config.js", (req, res) => {
  const configScript = `
export const API_CONFIG = {
  BASE_URL: ${JSON.stringify(apiBaseUrl)},
  FRONTEND_ORIGIN: ${JSON.stringify(frontendOrigin)},
  TIMEOUT: 10000,

  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };
    return headers;
  }
};
`;
  res.type("application/javascript").send(configScript);
});

// public 폴더 안의 정적 파일 전부 제공
app.use(express.static(path.join(__dirname, "public")));

// 루트 요청 → index.html 열기
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/index/index.html"));
});

app.get("/health", (req, res) => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const timeString = `${hh}:${mm}:${ss}`;

  res.status(200).send(`OK - ${timeString} \n`);
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/login/login.html"));
});

app.get("/user/join/agree", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/join/agree.html"));
});

app.get("/user/join/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/join/register.html"));
});

app.listen(port, () => {
  console.log(`Frontend running at ${frontendOrigin}`);
  console.log(`API base URL: ${apiBaseUrl}`);
  console.log(`Backend CORS should allow origin: ${frontendOrigin}`);
});
