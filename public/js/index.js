const logoutBtn = document.getElementById("logout-button");
const delAccBtn = document.getElementById("delete-account-btn");
const betBtn = document.getElementById("bet-btn");
const tempInput = document.getElementById("temp-input");
const todayCityContainer = document.getElementById("today-city");

function logout() {
    fetch("/private-api/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    window.location.replace("/login");
}

function deleteAccount() {
    fetch("/private-api/deleteAccount", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((response) => {
            if (response.error)
                return (
                    alert("failed to delete account"),
                    console.error(response.error)
                );

            alert(response.ok);

            fetch("/private-api/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }).then(() => {
                window.location.replace("/signUp");
            });
        });
}

function bet() {
    let temp = tempInput.value;
    if (!isValidTemp(temp)) return alert("invalid temperature");
    temp = temp.replace(",", ".");

    fetch("/private-api/tempBet", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ temp }),
    })
        .then((response) => response.json())
        .then((response) => {
            if (response.error) throw response.error;
            //TODO:show that bet was accepted
            tempInput.value = "";
        })
        .catch((e) => {
            alert(e);
        });
}

function isValidTemp(input = "") {
    const validChars = "0987654321.";
    input = input.replace(",", ".");
    for (let i = 0; i < input.length; i++)
        for (let j = 0; j < validChars.length; j++) {
            if (validChars[j] === input[i]) break;
            if (j >= validChars.length - 1) return false;
        }
    return input;
}

(function displayTodayCity() {
    fetch("/api/getTodayCity")
        .then((response) => response.json())
        .then((response) => {
            const { todayCity } = response;
            todayCityContainer.innerHTML = todayCity;
        });
})();

logoutBtn.onclick = logout;
delAccBtn.onclick = deleteAccount;
betBtn.onclick = bet;
