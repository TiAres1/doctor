const stars = document.querySelectorAll(".star");
const doctorNameInput = document.getElementById("doctor-name");
const submitButton = document.getElementById("submit-btn");
const topDoctorsList = document.getElementById("top-doctors");
const errorMsg = document.getElementById("error-msg");
const successMsg = document.getElementById("success-msg");

let currentRating = 0;

// توحيد النصوص
function normalizeText(text) {
    return text
        .replace(/أ|إ|آ/g, "ا") // استبدال جميع أنواع الهمزات بـ "ا"
        .replace(/ة/g, "ه") // استبدال التاء المربوطة بـ "ه"
        .replace(/\s+/g, " ") // إزالة المسافات الزائدة
        .trim() // إزالة المسافات الزائدة في البداية والنهاية
        .toLowerCase(); // تحويل النص إلى أحرف صغيرة
}

// جلب البيانات من LocalStorage
function readData() {
    const data = localStorage.getItem("doctors");
    return data ? JSON.parse(data) : [];
}

// حفظ البيانات إلى LocalStorage
function writeData(data) {
    localStorage.setItem("doctors", JSON.stringify(data));
}

// منع التكرار
function isDuplicate(doctors, name) {
    const normalizedName = normalizeText(name);
    return doctors.some((doctor) => normalizeText(doctor.name) === normalizedName);
}

// تحديث قائمة أفضل الدكاترة
function updateTopDoctors() {
    const doctors = readData();
    const topDoctors = doctors
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);

    topDoctorsList.innerHTML = "";
    topDoctors.forEach((doctor) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="star">★</span> ${doctor.name}`;
        topDoctorsList.appendChild(li);
    });
}

// عرض رسالة
function showMessage(element, message) {
    element.textContent = message;
    element.style.display = "block";
    setTimeout(() => {
        element.style.display = "none";
    }, 3000);
}

// تفعيل التقييم بالنجوم
stars.forEach((star) => {
    star.addEventListener("click", () => {
        const starValue = parseInt(star.getAttribute("data-value"));
        if (currentRating === starValue) {
            currentRating = starValue - 1;
        } else {
            currentRating = starValue;
        }

        // تحديث مظهر النجوم
        stars.forEach((s, index) => {
            if (index < currentRating) {
                s.textContent = "★";
                s.classList.add("filled");
            } else {
                s.textContent = "☆";
                s.classList.remove("filled");
            }
        });
    });
});

// عند الضغط على زر الإرسال
submitButton.addEventListener("click", () => {
    const doctorNameInputValue = doctorNameInput.value.trim();
    const arabicRegex = /^[\u0600-\u06FF\s]+$/;

    if (!arabicRegex.test(doctorNameInputValue)) {
        showMessage(errorMsg, "الرجاء كتابة اسم الدكتور باللغة العربية فقط!");
        return;
    }

    const doctorName = doctorNameInputValue.startsWith("د.")
        ? doctorNameInputValue
        : `د. ${doctorNameInputValue}`;

    const doctors = readData();

    if (isDuplicate(doctors, doctorName)) {
        showMessage(errorMsg, "هذا الدكتور تم تقييمه بالفعل!");
        return;
    }

    if (currentRating > 0) {
        doctors.push({ name: doctorName, rating: currentRating });
        writeData(doctors);
        showMessage(successMsg, "تم التقييم بنجاح!");
        updateTopDoctors();
        doctorNameInput.value = "";
        stars.forEach((star) => {
            star.textContent = "☆";
            star.classList.remove("filled");
        });
        currentRating = 0;
    } else {
        showMessage(errorMsg, "الرجاء اختيار التقييم!");
    }
});

// تحديث القائمة عند بدء التشغيل
updateTopDoctors();
