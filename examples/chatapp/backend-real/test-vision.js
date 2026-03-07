const fs = require('fs');
const http = require('http');

// Read and encode image
const img = fs.readFileSync('E:/cases/ChatBot/master/tests/pics/test01.png');
const imgBase64 = img.toString('base64');
console.log('Image size:', imgBase64.length, 'chars');

// Prepare request
const data = JSON.stringify({
  sessionId: 'vision-test-002',
  content: '图片里有什么内容？请详细描述。',
  images: [imgBase64]
});

// Send request
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/chat/message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const result = JSON.parse(body);
    console.log('Response:', result.data?.content || result.message || body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.setTimeout(120000, () => req.destroy());
req.write(data);
req.end();
