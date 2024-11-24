// إعداد Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA9lfQNMzI7-6P2GkskdJODE3yG-sVeAgg",
    authDomain: "doctor-e941b.firebaseapp.com",
    databaseURL: "https://doctor-e941b-default-rtdb.firebaseio.com",
    projectId: "doctor-e941b",
    storageBucket: "doctor-e941b.firebasestorage.app",
    messagingSenderId: "702360631722",
    appId: "1:702360631722:web:791c786562f43b3428d3d3",
    measurementId: "G-6RY5P2T1CJ"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// مرجع قاعدة البيانات
const database = firebase.database();
const doctorsRef = database.ref("doctors");

// عناصر الصفحة
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
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "") // إزالة الأحرف المحظورة (., #, $, [, ])
        .replace(/\s+/g, " ") // إزالة المسافات الزائدة
        .trim() // إزالة المسافات في البداية والنهاية
        .toLowerCase(); // تحويل النص إلى أحرف صغيرة
}


// عرض رسالة
function showMessage(element, message) {
    element.textContent = message;
    element.style.display = "block";
    setTimeout(() => {
        element.style.display = "none";
    }, 3000);
}

// التحقق إذا قام المستخدم بتقييم الدكتور سابقًا
function hasUserRatedDoctor(doctorName) {
    const ratedDoctors = JSON.parse(localStorage.getItem("ratedDoctors")) || [];
    return ratedDoctors.includes(doctorName);
}

// تسجيل تقييم المستخدم للدكتور
function saveUserRatedDoctor(doctorName) {
    const ratedDoctors = JSON.parse(localStorage.getItem("ratedDoctors")) || [];
    ratedDoctors.push(doctorName);
    localStorage.setItem("ratedDoctors", JSON.stringify(ratedDoctors));
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

    // تطبيع النص لجعله صالحًا كمسار في Firebase
    const normalizedName = normalizeText(doctorName);

    if (hasUserRatedDoctor(normalizedName)) {
        showMessage(errorMsg, "لقد قمت بتقييم هذا الدكتور سابقًا!");
        return;
    }

    if (currentRating > 0) {
        doctorsRef.child(normalizedName).once("value", (snapshot) => {
            const doctorData = snapshot.val();

            if (doctorData) {
                // إذا كان الدكتور موجودًا، قم بتحديث البيانات
                const newCount = doctorData.count + 1;
                const newTotal = doctorData.total + currentRating;
                const newAverage = newTotal / newCount;

                doctorsRef.child(normalizedName).update({
                    count: newCount,
                    total: newTotal,
                    average: newAverage,
                });
            } else {
                // إذا كان الدكتور جديدًا، أضف البيانات
                doctorsRef.child(normalizedName).set({
                    name: doctorName,
                    count: 1,
                    total: currentRating,
                    average: currentRating,
                });
            }

            // تسجيل الدكتور في قائمة التقييمات الخاصة بالمستخدم
            saveUserRatedDoctor(normalizedName);

            showMessage(successMsg, "تم التقييم بنجاح!");
            doctorNameInput.value = "";
            stars.forEach((star) => {
                star.textContent = "☆";
                star.classList.remove("filled");
            });
            currentRating = 0;
        });
    } else {
        showMessage(errorMsg, "الرجاء اختيار التقييم!");
    }
});

// تحديث قائمة أفضل الدكاترة
function updateTopDoctors() {
    doctorsRef.on("value", (snapshot) => {
        const doctors = snapshot.val() || {};
        const sortedDoctors = Object.values(doctors)
            .sort((a, b) => b.average - a.average)
            .reverse()
            .slice(0, 3);

        topDoctorsList.innerHTML = "";
        sortedDoctors.forEach((doctor) => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="star">★</span> ${doctor.name} - ${doctor.average.toFixed(1)} (${doctor.count} تقييم)`;
            topDoctorsList.appendChild(li);
        });
    });
}

// تحديث القائمة عند بدء التشغيل
updateTopDoctors();
