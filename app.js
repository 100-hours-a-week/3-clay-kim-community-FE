const express = require("express");
const path = require("path");

const app = express();

// public 폴더 안의 정적 파일 전부 제공
app.use(express.static(path.join(__dirname, "public")));

// 루트 요청 → index.html 열기
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/post/post.html"));
});

http://localhost:3000/health
app.get("/health", (req, res) => {
  const now = new Date();
	const hh = String(now.getHours()).padStart(2, '0');
	const mm = String(now.getMinutes()).padStart(2, '0');
	const ss = String(now.getSeconds()).padStart(2, '0');
	const timeString = `${hh}:${mm}:${ss}`;

	res.status(200).send(`OK - ${timeString} \n`);
})

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/login/login.html"));
});

app.get("/user/join/agree", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/join/agree.html"));
});

app.get("/user/join/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/join/register.html"));
});

app.listen(3000, () => {
  console.log("Frontend running at http://localhost:3000");
});
