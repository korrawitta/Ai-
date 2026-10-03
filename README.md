# Wealth Sense — AI Portfolio App (UI Prototype)

โปรเจกต์ React + Vite ที่ทำ mockup UI/UX ของแอปวิเคราะห์พอร์ตด้วย AI
ประกอบด้วย 4 หน้าจอหลัก:

1. **Onboarding** — แชทประเมินความเสี่ยงกับ AI Chatbot
2. **Portfolio Dashboard** — เทียบพอร์ตปัจจุบันกับ Target Allocation
3. **Price Tracker** — ราคาสด พร้อมแนวรับ/แนวต้านที่ AI วิเคราะห์
4. **Rebalance Alert** — แจ้งเตือนพอร์ตเสียสมดุล และสร้างแผนซื้อ/ขาย

> Onboarding, Dashboard allocation targets และ Rebalance plan ยังเป็น mock data
> ส่วน **ราคาหุ้น/คริปโตและกราฟใน Dashboard และ Price Tracker ดึงจาก Yahoo Finance
> ผ่าน yfinance แบบสด** (ดูส่วน Backend ด้านล่าง)

## โครงสร้างโปรเจกต์

```
backend/
  app.py               # Flask API ที่ดึงข้อมูลด้วย yfinance
  requirements.txt
src/
  api.js                # ฟังก์ชันเรียก backend (fetchQuotes, fetchHistory, fetchLevels)
  components/
    Onboarding.jsx      # หน้าจอ 1: ประเมินความเสี่ยง (mock)
    Dashboard.jsx        # หน้าจอ 2: ภาพรวมพอร์ต — ราคาถือครองดึงสดจาก backend
    PriceTracker.jsx     # หน้าจอ 3: ราคาสด + กราฟ + แนวรับ/แนวต้าน (ทั้งหมดดึงสด)
    Rebalance.jsx         # หน้าจอ 4: แจ้งเตือน + แผนปรับพอร์ต (mock)
    TabBar.jsx            # แถบเมนูล่างของแอป
  App.jsx                 # จัดการ state สลับหน้าจอ
  index.css               # ธีมสี, ฟอนต์, และสไตล์ทั้งหมด
  main.jsx                 # entry point
```

## เริ่มต้นใช้งาน

ต้องรัน 2 ฝั่งพร้อมกัน: backend (Flask + yfinance) และ frontend (Vite)

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

จะรันอยู่ที่ `http://localhost:5000` ลองเช็คได้ที่ `http://localhost:5000/api/health`

### 2. Frontend

เปิด terminal อีกหน้าต่าง จาก root ของโปรเจกต์:

```bash
cp .env.example .env     # ปรับ VITE_API_BASE_URL ถ้า backend รันคนละพอร์ต/โฮสต์
npm install
npm run dev
```

เปิด `http://localhost:5173` เพื่อดูแอป — หน้า Dashboard และ Price Tracker
จะเรียก backend เพื่อโหลดราคาล่าสุดโดยอัตโนมัติ

### Build สำหรับ production

```bash
npm run build
npm run preview
```

## API endpoints (backend/app.py)

| Endpoint | คำอธิบาย |
|---|---|
| `GET /api/quotes?symbols=PTT.BK,AAPL,BTC-USD` | ราคาล่าสุด, ราคาปิดก่อนหน้า, % เปลี่ยนแปลง ของแต่ละสัญลักษณ์ |
| `GET /api/history/<symbol>?range=1mo&interval=1d` | แท่งราคา OHLCV สำหรับวาดกราฟ (range/interval ใช้ค่าเดียวกับ yfinance เช่น `5d`+`15m`, `1y`+`1wk`) |
| `GET /api/levels/<symbol>` | แนวรับ/แนวต้านแบบ Pivot Point (pivot, r1, r2, s1, s2) คำนวณจากแท่งเทียนวันล่าสุด |
| `POST /api/notify` | ส่งอีเมลแจ้งเตือน — body: `{"email": "...", "subject": "...", "message": "..."}` (subject/message ไม่บังคับ มีค่า default ให้) |

### ตั้งค่าการส่งอีเมล (ปุ่ม "เตือนฉันอีกครั้งใน 7 วัน")

ปุ่มนี้ในหน้า Rebalance เรียก `POST /api/notify` ซึ่งส่งอีเมลจริงผ่าน SMTP —
ต้องตั้งค่าก่อนถึงจะใช้งานได้:

```bash
cd backend
cp .env.example .env
```

แก้ไฟล์ `backend/.env` ใส่ค่า SMTP จริง (ตัวอย่างใช้ Gmail):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=youraddress@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM_EMAIL=youraddress@gmail.com
```

> Gmail ไม่รับรหัสผ่านบัญชีปกติสำหรับ SMTP ต้องสร้าง **App Password** แทน
> (เปิด 2-Step Verification ก่อน แล้วไปที่
> [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords))
> ผู้ให้บริการอีเมลอื่น (Outlook, บริษัทที่ทำงาน ฯลฯ) จะมีค่า host/port ของตัวเอง

`backend/.env` ถูกใส่ไว้ใน `.gitignore` แล้ว จะไม่ถูก commit ขึ้น GitHub
รีสตาร์ท `python app.py` หลังแก้ `.env` ทุกครั้งเพื่อให้ค่าค่าใหม่มีผล

**สัญลักษณ์ (ticker) บน Yahoo Finance**: หุ้นไทยในตลาด SET ต้องมี suffix `.BK`
(เช่น `PTT.BK`, `AOT.BK`) ส่วนคริปโตใช้คู่ `-USD` (เช่น `BTC-USD`, `ETH-USD`)

> yfinance ดึงข้อมูลจากหน้าเว็บ/endpoint สาธารณะของ Yahoo Finance เหมาะสำหรับ
> ทำต้นแบบและพัฒนา แต่ไม่มี SLA หรือการรับประกัน rate limit อย่างเป็นทางการ —
> สำหรับโปรดักชันจริงควรพิจารณาผู้ให้บริการข้อมูลตลาดแบบเสียเงิน

## สิ่งที่ต้องทำต่อ (ยังไม่รวมในโปรเจกต์นี้)

- ระบบดึงข่าวรายวันและวิเคราะห์ด้วย LLM/NLP เพื่อหา sentiment
- Trend line / จุดกลับตัวของตลาดแบบอัตโนมัติ (ตอนนี้มีแค่ pivot point ง่าย ๆ)
- Backend สำหรับเก็บโปรไฟล์ความเสี่ยงและพอร์ตของผู้ใช้แต่ละคน (ตอนนี้ allocation/holdings เป็น mock)
- ระบบยืนยันคำสั่งซื้อ/ขายจริงหลังจากกด "Generate Rebalancing Plan"
- Caching / rate-limit handling ฝั่ง backend หากเรียก Yahoo Finance ถี่เกินไป

## เทคโนโลยีที่ใช้

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Flask](https://flask.palletsprojects.com/) + [yfinance](https://github.com/ranaroussi/yfinance)
- Google Fonts: Sarabun (ข้อความไทย), Space Grotesk (ตัวเลข/ราคา)
