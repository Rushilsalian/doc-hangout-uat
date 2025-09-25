const fs = require('fs');
const { createCanvas } = require('canvas');

function drawStethoscope(ctx, size) {
    const scale = size / 24;
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = Math.max(2 * scale, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Main vertical line
    ctx.beginPath();
    ctx.moveTo(11 * scale, 2 * scale);
    ctx.lineTo(11 * scale, 22 * scale);
    ctx.stroke();
    
    // Top branches
    ctx.beginPath();
    ctx.moveTo(15 * scale, 5 * scale);
    ctx.lineTo(11 * scale, 9 * scale);
    ctx.lineTo(7 * scale, 5 * scale);
    ctx.stroke();
    
    // Right branch
    ctx.beginPath();
    ctx.moveTo(21 * scale, 15 * scale);
    ctx.lineTo(19 * scale, 13 * scale);
    ctx.lineTo(17 * scale, 15 * scale);
    ctx.stroke();
    
    // Circles
    ctx.beginPath();
    ctx.arc(16 * scale, 19 * scale, 2 * scale, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(8 * scale, 19 * scale, 2 * scale, 0, 2 * Math.PI);
    ctx.fill();
}

// Create 192x192 icon
const canvas192 = createCanvas(192, 192);
const ctx192 = canvas192.getContext('2d');
ctx192.fillStyle = '#ffffff';
ctx192.fillRect(0, 0, 192, 192);
drawStethoscope(ctx192, 192);
fs.writeFileSync('./public/icon-192.png', canvas192.toBuffer('image/png'));

// Create 512x512 icon
const canvas512 = createCanvas(512, 512);
const ctx512 = canvas512.getContext('2d');
ctx512.fillStyle = '#ffffff';
ctx512.fillRect(0, 0, 512, 512);
drawStethoscope(ctx512, 512);
fs.writeFileSync('./public/icon-512.png', canvas512.toBuffer('image/png'));

// Create 32x32 favicon
const canvas32 = createCanvas(32, 32);
const ctx32 = canvas32.getContext('2d');
ctx32.fillStyle = '#ffffff';
ctx32.fillRect(0, 0, 32, 32);
drawStethoscope(ctx32, 32);
fs.writeFileSync('./public/favicon.png', canvas32.toBuffer('image/png'));

console.log('Icons generated successfully!');