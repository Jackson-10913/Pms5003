const { SerialPortStream } = require('@serialport/stream');
const { autoDetect } = require('@serialport/bindings-cpp');
const express = require('express');
const path = require('path');
const Binding = autoDetect();

let latestData = ''; // 用於存儲接收到的數據
let parsedData = []; // 用於存儲解析後的數據

const port = new SerialPortStream({
  path: 'COM3',
  baudRate: 9600,
  binding: Binding
});

// 當接收到數據時觸發
port.on('data', (data) => {
  latestData += data.toString(); // 將接收到的數據轉換為字符串並追加到 latestData
  if (latestData.includes('\n')) { // 假設每個數據包以換行符結尾
    const lines = latestData.split('\n'); // 按換行符分割數據
    latestData = lines.pop(); // 保留未完整的數據

    // 解析每行數據
    lines.forEach(line => {
      if (line.trim().length > 0) { // 確保行不為空
        const dataValues = line.split(',').map(value => value.trim()); // 按逗號分割並去除空格
        if (dataValues.length >= 3) { // 確保數據長度足夠
          parsedData = dataValues; // 更新解析後的數據
        }
      }
    });

    console.log('Parsed data:', parsedData); // 輸出解析後的數據
  }
});

const app = express();
const portNumber = 8888;

// 設置靜態文件夾
app.use(express.static(path.join(__dirname, 'public')));

// 定義 '/sensor' 路由，返回傳感器數據
app.get('/sensor', (req, res) => {
  if (parsedData.length >= 3) { // 確保數據長度足夠
    res.json({
      value1: parsedData[0], // PM2.5
      value2: parsedData[1], // 溫度
      value3: parsedData[2]  // 濕度
    });
  } else {
    res.status(400).send('數據不足'); // 數據不足時返回 400 錯誤
  }
});

// 啟動服務器
app.listen(portNumber, () => {
  console.log(`服務器運行在 http://localhost:${portNumber}/`);
});
