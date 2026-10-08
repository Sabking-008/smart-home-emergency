# Smart Home Emergency System - Render

## 1. Upload to GitHub
Upload every file and folder from this project.

## 2. Create Render Web Service
Use the GitHub repository.

Build Command:
npm install

Start Command:
npm start

## 3. Render environment variable
Add:
ESP_DEVICE_KEY

Set it to your own long random secret. Do not put the real secret in GitHub.

## 4. ESP8266 API
Send sensor data:
POST https://YOUR-RENDER-URL.onrender.com/api/esp/status

Header:
x-esp-key: YOUR_SECRET

Get website commands:
GET https://YOUR-RENDER-URL.onrender.com/api/esp/commands

Header:
x-esp-key: YOUR_SECRET

Commands:
ARM
DISARM
ALARM_ON
ALARM_OFF
FIRE_SOUND
SERVO with value 0-180

## Important
The browser talks to Render. The ESP8266 also connects outbound to Render. Do not use 192.168.4.1 as the public website's ESP URL.