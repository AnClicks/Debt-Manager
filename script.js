// Select elements from the DOM
const names = document.querySelector("#nameInput");
const amount = document.querySelector("#amountInput");
const debtAddBtn = document.querySelector("#addBtn");
const debtList = document.querySelector(".debt-list");
const totalDebtDisplay = document.querySelector("#totalDebt");
const loginContainer = document.querySelector("#loginContainer");
const debtManagerContainer = document.querySelector("#debtManagerContainer");

let userRole = 'viewer';

const OPAL_SERVER_URL = 'http://localhost:7002/policy';

function login(role) {
    userRole = role;
    loginContainer.style.display = 'none';
    debtManagerContainer.style.display = 'block';
}
//local policies
async function policyCheck(action) {
    const policies = {
        admin: {
            canAdd: true,
            canDelete: true,
            canEdit: true
        },
        viewer: {
            canAdd: false,
            canDelete: false,
            canEdit: false
        }
    };

    try {
        const response = await fetch(OPAL_SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: {
                    role: userRole,
                    action: action
                }
            })
        });

         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Response:', result);

        return result.result.allow;
    } catch (error) {
        console.error('Error fetching policy check:', error);
        console.log('Falling back to local policies.');
        return policies[userRole][action];
    }
}

document.addEventListener("DOMContentLoaded", getLocalDebts);
debtAddBtn.addEventListener("click", async function(event) {
    if (await policyCheck('canAdd')) {
        addDebt(event);
    } else {
        alert("You do not have permission to add debts.");
    }
});

async function addDebt(event) {
    event.preventDefault();

    const nameValue = names.value.trim();
    const amountValue = amount.value.trim();

    if (!nameValue || !amountValue || isNaN(parseFloat(amountValue))) {
        alert("Please enter both name and a valid amount.");
        return;
    }

    const debtDiv = document.createElement("div");
    debtDiv.classList.add("debt");

    const newDebtName = document.createElement("li");
    newDebtName.innerText = nameValue;
    newDebtName.classList.add("debt-item");
    debtDiv.appendChild(newDebtName);

    const newDebtAmount = document.createElement("li");
    newDebtAmount.innerText = amountValue;
    newDebtAmount.classList.add("debt-item");
    debtDiv.appendChild(newDebtAmount);

    const editBtn = document.createElement("button");
    editBtn.innerText = "Edit";
    editBtn.classList.add("edit-btn");
    editBtn.addEventListener("click", async function(event) {
        if (await policyCheck('canEdit')) {
            editDebt(event);
        } else {
            alert("You do not have permission to edit debts.");
        }
    });
    debtDiv.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", async function(event) {
        if (await policyCheck('canDelete')) {
            deleteDebt(event);
        } else {
            alert("You do not have permission to delete debts.");
        }
    });
    debtDiv.appendChild(deleteBtn);

    debtList.appendChild(debtDiv);

    saveLocalDebts(nameValue, amountValue);

    names.value = "";
    amount.value = "";

    updateTotalDebt();
}

function saveLocalDebts(name, amount) {
    let debts;
    if (localStorage.getItem("debts") === null) {
        debts = [];
    } else {
        debts = JSON.parse(localStorage.getItem("debts"));
    }

    debts.push({ name, amount: parseFloat(amount) });
    localStorage.setItem("debts", JSON.stringify(debts));
}

function getLocalDebts() {
    let debts;
    if (localStorage.getItem("debts") === null) {
        debts = [];
    } else {
        debts = JSON.parse(localStorage.getItem("debts"));
    }

    debts.forEach(function(debt) {
        const debtDiv = document.createElement("div");
        debtDiv.classList.add("debt");

        const newDebtName = document.createElement("li");
        newDebtName.innerText = debt.name;
        newDebtName.classList.add("debt-item");
        debtDiv.appendChild(newDebtName);

        const newDebtAmount = document.createElement("li");
        newDebtAmount.innerText = debt.amount;
        newDebtAmount.classList.add("debt-item");
        debtDiv.appendChild(newDebtAmount);

        const editBtn = document.createElement("button");
        editBtn.innerText = "Edit";
        editBtn.classList.add("edit-btn");
        editBtn.addEventListener("click", async function(event) {
            if (await policyCheck('canEdit')) {
                editDebt(event);
            } else {
                alert("You do not have permission to edit debts.");
            }
        });
        debtDiv.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", async function(event) {
            if (await policyCheck('canDelete')) {
                deleteDebt(event);
            } else {
                alert("You do not have permission to delete debts.");
            }
        });
        debtDiv.appendChild(deleteBtn);

        debtList.appendChild(debtDiv);
    });

    updateTotalDebt();
}

async function editDebt(event) {
    const debtDiv = event.target.parentElement;
    const debtName = debtDiv.children[0].innerText;
    const debtAmount = debtDiv.children[1].innerText;

    names.value = debtName;
    amount.value = debtAmount;

    deleteDebt(event);
}

async function deleteDebt(event) {
    const debtDiv = event.target.parentElement;
    const debtName = debtDiv.children[0].innerText;
    const debtAmount = debtDiv.children[1].innerText;

    let debts = JSON.parse(localStorage.getItem("debts"));
    debts = debts.filter(debt => !(debt.name === debtName && debt.amount === parseFloat(debtAmount)));
    localStorage.setItem("debts", JSON.stringify(debts));

    debtDiv.remove();

    updateTotalDebt();
}

function updateTotalDebt() {
    let debts = JSON.parse(localStorage.getItem("debts")) || [];
    let total = debts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
    totalDebtDisplay.innerText = total.toFixed(2);
}

document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem("debts") === null || JSON.parse(localStorage.getItem("debts")).length === 0) {
        totalDebtDisplay.innerText = "0.00";
    }
});

document.getElementById('viewerBtn').addEventListener('click', function() {
    login('viewer');
});

document.getElementById('adminBtn').addEventListener('click', function() {
    login('admin');
});