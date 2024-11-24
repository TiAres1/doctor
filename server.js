const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// مسار ملف JSON
const dataPath = path.join(__dirname, "doctors.json");

// إعداد middleware
app.use(express.json());
app.use(express.static("public"));

// قراءة البيانات من ملف JSON
const readData = () => {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify([]));
    const jsonData = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(jsonData);
};

// كتابة البيانات إلى ملف JSON
const writeData = (data) => {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), "utf8");
};

// توحيد النصوص
function normalizeText(text) {
    return text
        .replace(/أ|إ|آ/g, "ا") // استبدال جميع أنواع الهمزات بـ "ا"
        .replace(/ة/g, "ه") // استبدال التاء المربوطة بـ "ه"
        .replace(/\s+/g, " ") // إزالة المسافات الزائدة
        .trim() // إزالة المسافات الزائدة في البداية والنهاية
        .toLowerCase(); // تحويل النص إلى أحرف صغيرة
}

// منع التكرار
const isDuplicate = (doctors, name) => {
    const normalizedName = normalizeText(name);
    return doctors.some((doctor) => normalizeText(doctor.name) === normalizedName);
};

// Endpoint لإضافة تقييم
app.post("/add-rating", (req, res) => {
    const { name, rating } = req.body;

    if (!name || !rating || typeof rating !== "number" || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Invalid input" });
    }

    // توحيد الاسم
    const doctorName = name.startsWith("د.") ? name : `د. ${name}`;

    // قراءة البيانات الحالية
    const doctors = readData();

    // منع التكرار
    if (isDuplicate(doctors, doctorName)) {
        return res.status(409).json({ error: "هذا الدكتور تم تقييمه بالفعل!" });
    }

    // إضافة التقييم
    doctors.push({ name: doctorName, rating });

    // حفظ البيانات
    writeData(doctors);

    res.json({ success: true });
});

// Endpoint لجلب أفضل 3 دكاترة
app.get("/top-doctors", (req, res) => {
    const doctors = readData();
    const topDoctors = doctors
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
    res.json(topDoctors);
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
