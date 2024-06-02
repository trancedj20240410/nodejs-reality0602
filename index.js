const username = process.env.WEB_USERNAME || "renderadmin";
const password = process.env.WEB_PASSWORD || "renderpassword";
const projectPageURL = `https://nodejs-reality-0602.onrender.com`;// 替换为你的项目域名
const port = process.env.PORT || 3000;
const express = require("express");
const app = express();
const exec = require("child_process").exec;
const { createProxyMiddleware } = require("http-proxy-middleware");
const fs = require("fs");
const request = require("request");
const path = require("path");
const auth = require("basic-auth");
const axios = require('axios');
const os = require('os');


app.get("/", function(req, res) {
  res.send("hello world");
});

// 读取list和sub文件
app.get("/list", (req, res) => {
  const user = auth(req);
  if (
    user &&
    user.name === username &&
    user.pass === password
  ) {
    fs.readFile("list.txt", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Error reading list.txt" });
      } else {
        res.status(200).send(data);
      }
    });
  } else {
    res.set("WWW-Authenticate", 'Basic realm="Node"');
    res.status(401).send("Unauthorized");
  }
});
app.get("/sub", (req, res) => {
  const user = auth(req);
  if (
    user &&
    user.name === username &&
    user.pass === password
  ) {
    fs.readFile("sub.txt", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Error reading sub.txt" });
      } else {
        res.status(200).send(data);
      }
    });
  } else {
    res.set("WWW-Authenticate", 'Basic realm="Node"');
    res.status(401).send("Unauthorized");
  }
});

app.use(
  "/",
  createProxyMiddleware({
    changeOrigin: true,
    onProxyReq: function onProxyReq(proxyReq, req, res) { },
    pathRewrite: {
      "^/": "/",
    },
    target: "http://127.0.0.1:8080/",
    ws: true,
  })
);


// 判断系统架构
function getSystemArchitecture() {
  const arch = os.arch();
  if (arch === 'arm' || arch === 'arm64') {
    return 'arm';
  } else {
    return 'amd';
  }
}

// 下载必要运行文件
function downloadFile(fileName, fileUrl, callback) {
  let stream = fs.createWriteStream(path.join("./", fileName));
  request(fileUrl)
    .pipe(stream)
    .on("close", function(err) {
      if (err) {
        callback(`Download ${fileName} file failed`);
      } else {
        callback(null, fileName);
      }
    });
}

// 根据系统架构返回对应的文件url
function getFilesForArchitecture(architecture) {
  if (architecture === 'arm') {
    return [
      { fileName: "web", fileUrl: "https://github.com/eoovve/test/releases/download/ARM/web" },
      { fileName: "swith", fileUrl: "https://github.com/eoovve/test/releases/download/ARM/swith" },
      { fileName: "server", fileUrl: "https://github.com/eoovve/test/releases/download/ARM/server" },
    ];
  } else if (architecture === 'amd') {
    return [
      { fileName: "web", fileUrl: "https://github.com/eoovve/test/raw/main/web" },
      { fileName: "swith", fileUrl: "https://github.com/eoovve/test/raw/main/swith" },
      { fileName: "server", fileUrl: "https://github.com/eoovve/test/raw/main/server" },
    ];
  }
  return [];
}

function downloadAndRunFiles() {
  const architecture = getSystemArchitecture();
  const filesToDownload = getFilesForArchitecture(architecture);

  if (filesToDownload.length === 0) {
    console.log(`Can't find a file for the current architecture`);
    return;
  }

  let downloadedCount = 0;

  filesToDownload.forEach(fileInfo => {
    downloadFile(fileInfo.fileName, fileInfo.fileUrl, (err, fileName) => {
      if (err) {
        console.log(`Download ${fileName} failed`);
      } else {
        console.log(`Download ${fileName} successfully`);
      }

      downloadedCount++;

      if (downloadedCount === filesToDownload.length) {
        console.log("All files downloaded");

        // 执行start.sh
        exec("bash start.sh", function(err, stdout, stderr) {
          if (err) {
            console.error(err);
            return;
          }
          console.log(stdout);
        });

        app.listen(port, () => console.log(`Server is running on port ${port}!`));
      }
    });
  });
}
downloadAndRunFiles();

// 定义访问间隔时间（2分钟）
const intervalInMilliseconds = 2 * 60 * 1000;
async function visitProjectPage() {
  try {
    // console.log(`Visiting project page: ${projectPageURL}`);
    await axios.get(projectPageURL);
    console.log('Page visited successfully.');
  } catch (error) {
    console.error('Error visiting project page:', error.message);
  }
}

setInterval(visitProjectPage, intervalInMilliseconds);
visitProjectPage();
