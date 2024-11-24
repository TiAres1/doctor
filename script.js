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

firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const doctorsRef = database.ref("doctors");

const stars = document.querySelectorAll(".star");
const doctorNameInput = document.getElementById("doctor-name");
const submitButton = document.getElementById("submit-btn");
const topDoctorsList = document.getElementById("top-doctors");
const errorMsg = document.getElementById("error-msg");
const successMsg = document.getElementById("success-msg");

let currentRating = 0;

function normalizeText(text) {
    return text
        .replace(/أ|إ|آ/g, "ا") // استبدال جميع أنواع الهمزات بـ "ا"
        .replace(/ة/g, "ه") // استبدال التاء المربوطة بـ "ه"
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "") // إزالة الأحرف المحظورة مثل ., #, $, [, ]
        .replace(/\s+/g, " ") // إزالة المسافات الزائدة
        .trim() // إزالة المسافات الزائدة في البداية والنهاية
        .toLowerCase(); // تحويل النص إلى أحرف صغيرة
}

function showMessage(element, message) {
    element.textContent = message;
    element.style.display = "block";
    setTimeout(() => {
        element.style.display = "none";
    }, 3000);
}

function hasUserRatedDoctor(doctorName) {
    const ratedDoctors = JSON.parse(localStorage.getItem("ratedDoctors")) || [];
    return ratedDoctors.includes(doctorName);
}

function saveUserRatedDoctor(doctorName) {
    const ratedDoctors = JSON.parse(localStorage.getItem("ratedDoctors")) || [];
    ratedDoctors.push(doctorName);
    localStorage.setItem("ratedDoctors", JSON.stringify(ratedDoctors));
}

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

function syncLocalStorageWithFirebase() {
    doctorsRef.once("value", (snapshot) => {
        const firebaseDoctors = snapshot.val() || {};
        const firebaseDoctorNames = Object.keys(firebaseDoctors);
        const ratedDoctors = JSON.parse(localStorage.getItem("ratedDoctors")) || [];

        const updatedRatedDoctors = ratedDoctors.filter((name) =>
            firebaseDoctorNames.includes(name)
        );

        localStorage.setItem("ratedDoctors", JSON.stringify(updatedRatedDoctors));

        console.log("تمت مزامنة LocalStorage مع Firebase:", updatedRatedDoctors);
    });
}


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

    const normalizedName = normalizeText(doctorName);

    syncLocalStorageWithFirebase();

    if (hasUserRatedDoctor(normalizedName)) {
        showMessage(errorMsg, "لقد قمت بتقييم هذا الدكتور سابقًا!");
        return;
    }

    if (currentRating > 0) {
        doctorsRef.child(normalizedName).once("value", (snapshot) => {
            const doctorData = snapshot.val();

            if (doctorData) {
                const newCount = doctorData.count + 1;
                const newTotal = doctorData.total + currentRating;
                const newAverage = newTotal / newCount;

                doctorsRef.child(normalizedName).update({
                    count: newCount,
                    total: newTotal,
                    average: newAverage,
                });
            } else {
                doctorsRef.child(normalizedName).set({
                    name: doctorName,
                    count: 1,
                    total: currentRating,
                    average: currentRating,
                });
            }

            saveUserRatedDoctor(normalizedName);

            updateTopDoctors();

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

function updateTopDoctors() {
    doctorsRef.on("value", (snapshot) => {
        const doctors = snapshot.val() || {};

        const sortedDoctors = Object.values(doctors)
            .sort((a, b) => b.average - a.average) 
            .slice(0, 3); 

        topDoctorsList.innerHTML = "";

        sortedDoctors.forEach((doctor) => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="star">★</span> ${doctor.name}`;
            topDoctorsList.appendChild(li);
        });
    });
}

updateTopDoctors();

syncLocalStorageWithFirebase();